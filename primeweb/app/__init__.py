import os
import secrets
import sqlite3
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path

from flask import Flask, abort, flash, g, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash

from dotenv import load_dotenv

load_dotenv()


STATUSES = ["New", "Contacted", "Quotation Sent", "Approved", "In Progress", "Completed", "Declined"]
SERVICES = ["Website Development", "Custom Web Application", "Website Maintenance", "IT Support", "Not sure yet"]


def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.update(
        SECRET_KEY=os.environ.get("PRIMEWEB_SECRET_KEY") or secrets.token_hex(32),
        DATABASE=os.environ.get("PRIMEWEB_DATABASE") or str(Path(app.instance_path) / "primeweb.sqlite3"),
        ADMIN_PASSWORD_HASH=os.environ.get("PRIMEWEB_ADMIN_PASSWORD_HASH", ""),
        MAX_CONTENT_LENGTH=5 * 1024 * 1024,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("PRIMEWEB_HTTPS", "0") == "1",
    )
    os.makedirs(app.instance_path, exist_ok=True)

    @app.before_request
    def prepare_request():
        if "csrf_token" not in session:
            session["csrf_token"] = secrets.token_urlsafe(32)

    @app.context_processor
    def inject_globals():
        return {"csrf_token": session.get("csrf_token", ""), "year": datetime.now().year}

    def database():
        if "db" not in g:
            g.db = sqlite3.connect(app.config["DATABASE"])
            g.db.row_factory = sqlite3.Row
        return g.db

    @app.teardown_appcontext
    def close_database(_error=None):
        db = g.pop("db", None)
        if db is not None:
            db.close()

    def init_db():
        db = database()
        db.execute("""CREATE TABLE IF NOT EXISTS enquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            name TEXT NOT NULL,
            business TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL,
            phone TEXT NOT NULL DEFAULT '',
            service TEXT NOT NULL,
            budget TEXT NOT NULL DEFAULT '',
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'New'
        )""")
        db.commit()

    with app.app_context():
        init_db()

    @app.before_request
    def check_csrf():
        if request.method == "POST":
            submitted = request.form.get("csrf_token", "")
            expected = session.get("csrf_token", "")
            if not submitted or not secrets.compare_digest(submitted, expected):
                abort(400, "Form expired. Please go back, refresh, and try again.")

    def admin_required(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if not app.config["ADMIN_PASSWORD_HASH"]:
                return render_template("admin_unconfigured.html"), 503
            if not session.get("admin"):
                return redirect(url_for("admin_login", next=request.path))
            return view(*args, **kwargs)
        return wrapped

    @app.get("/")
    def home():
        return render_template("home.html", title="Digital solutions. Built for growth.")

    @app.get("/about")
    def about():
        return render_template("about.html", title="About PrimeWeb Solutions")

    @app.get("/services")
    def services():
        return render_template("services.html", title="Web, software and IT services")

    @app.get("/pricing")
    def pricing():
        return render_template("pricing.html", title="Straightforward starting prices")

    @app.get("/portfolio")
    def portfolio():
        return render_template("portfolio.html", title="Portfolio")

    @app.route("/contact", methods=["GET", "POST"])
    def contact():
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            email = request.form.get("email", "").strip()
            message = request.form.get("message", "").strip()
            if not name or len(name) > 120 or len(email) > 254 or "@" not in email or not message or len(message) > 5000:
                flash("Please check your name, email address and message, then try again.", "error")
            else:
                database().execute(
                    "INSERT INTO enquiries (created_at,name,business,email,phone,service,budget,message) VALUES (?,?,?,?,?,?,?,?)",
                    (datetime.now(timezone.utc).isoformat(timespec="seconds"), name, request.form.get("business", "").strip()[:160], email, request.form.get("phone", "").strip()[:40], "General enquiry", "", message),
                )
                database().commit()
                flash("Thanks for reaching out. Your enquiry has been received.", "success")
                return redirect(url_for("contact"))
        return render_template("contact.html", title="Get in touch")

    @app.route("/quote", methods=["GET", "POST"])
    def quote():
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            email = request.form.get("email", "").strip()
            message = request.form.get("message", "").strip()
            service = request.form.get("service", "")
            if not name or len(name) > 120 or len(email) > 254 or "@" not in email or not message or len(message) > 5000 or service not in SERVICES:
                flash("Please complete the required fields and select a service.", "error")
            else:
                database().execute(
                    "INSERT INTO enquiries (created_at,name,business,email,phone,service,budget,message) VALUES (?,?,?,?,?,?,?,?)",
                    (datetime.now(timezone.utc).isoformat(timespec="seconds"), name, request.form.get("business", "").strip()[:160], email, request.form.get("phone", "").strip()[:40], service, request.form.get("budget", "").strip()[:80], message),
                )
                database().commit()
                flash("Your quote request is in. We’ll be in touch to discuss the details.", "success")
                return redirect(url_for("quote"))
        return render_template("quote.html", title="Request a quote", services=SERVICES)

    @app.route("/admin/login", methods=["GET", "POST"])
    def admin_login():
        if not app.config["ADMIN_PASSWORD_HASH"]:
            return render_template("admin_unconfigured.html"), 503
        if request.method == "POST":
            password = request.form.get("password", "")
            if check_password_hash(app.config["ADMIN_PASSWORD_HASH"], password):
                session.clear()
                session["admin"] = True
                session["csrf_token"] = secrets.token_urlsafe(32)
                return redirect(url_for("admin_dashboard"))
            flash("That password was not recognised.", "error")
        return render_template("admin_login.html", title="Administrator sign in")

    @app.post("/admin/logout")
    @admin_required
    def admin_logout():
        session.clear()
        return redirect(url_for("home"))

    @app.get("/admin")
    @admin_required
    def admin_dashboard():
        enquiries = database().execute("SELECT * FROM enquiries ORDER BY id DESC").fetchall()
        return render_template("admin.html", title="Enquiries", enquiries=enquiries, statuses=STATUSES)

    @app.post("/admin/enquiries/<int:enquiry_id>/status")
    @admin_required
    def update_status(enquiry_id):
        status = request.form.get("status", "")
        if status not in STATUSES:
            abort(400)
        result = database().execute("UPDATE enquiries SET status=? WHERE id=?", (status, enquiry_id))
        database().commit()
        if result.rowcount == 0:
            abort(404)
        flash("Enquiry status updated.", "success")
        return redirect(url_for("admin_dashboard"))

    @app.after_request
    def security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        script_sources = "'self' https://cdn.jsdelivr.net" if request.endpoint == "home" else "'self'"
        response.headers.setdefault("Content-Security-Policy", f"default-src 'self'; style-src 'self'; script-src {script_sources}; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'self'")
        return response

    return app
