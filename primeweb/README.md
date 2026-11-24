# PrimeWeb Solutions

A small Flask website for PrimeWeb Solutions, using SQLite for customer enquiries. It includes the public pages, contact and quote forms, and a password protected enquiry dashboard. The public portfolio page is intentionally a placeholder until real work is ready to show.

## Run locally on Windows

Open PowerShell in this `primeweb` folder:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python run.py
```

Open `http://127.0.0.1:5000`. The database is created at `instance/primeweb.sqlite3` on first launch. Do not commit `.env`, the database, or customer enquiry records.

If port 5000 is already in use, set a different port before launching, for example `$env:PRIMEWEB_PORT=5001; python run.py`, then open `http://127.0.0.1:5001`.

The website forms work locally without enabling administrator access. To enable the dashboard, edit `.env` and configure `PRIMEWEB_SECRET_KEY` with a long, random secret and `PRIMEWEB_ADMIN_PASSWORD_HASH` with a Werkzeug password hash. Generate the hash in PowerShell after activating the virtual environment:

```powershell
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash(input('Admin password: ')))"
```

Paste the printed hash into `.env` as the value of `PRIMEWEB_ADMIN_PASSWORD_HASH`, and replace the example secret key with a long random value. Restart the app and visit `/admin/login`. Keep these values private. The admin area is disabled when no hash is configured.

When running behind HTTPS, set `PRIMEWEB_HTTPS=1` so the session cookie is marked secure. For a local HTTP session, leave it at `0`.

## Current scope

- Home, About, Services, Pricing, Portfolio, Contact and Request a Quote pages.
- A homepage Three.js scene with animated wireframe forms, orbit rings and subtle pointer response. It loads Three.js 0.187.0 from jsDelivr only on the homepage; a WebGL failure leaves the CSS hero art visible.
- Contact and quote requests stored in SQLite and visible to the configured administrator.
- Enquiry status updates: New, Contacted, Quotation Sent, Approved, In Progress, Completed and Declined.
- CSRF tokens on POST forms, parameterised SQL, secure cookie flags, request size limit and basic security headers.
- Optional file uploads, customer accounts, quotation approval, invoicing and payments are not implemented in this initial version.

Prices are starting estimates supplied in the project brief. Confirm exact scope, third-party fees and any applicable VAT in each quotation. This app is a local starting point; configure production hosting, HTTPS, backups and operational monitoring before accepting live customer information.

The homepage 3D effect needs a WebGL-capable browser and an internet connection to load the pinned Three.js module from jsDelivr. The Flask app does not require Node.js or npm to serve it.


## Administrator Setup (Local Development)

PrimeWeb includes a password-protected administrator dashboard for viewing customer enquiries and updating their statuses.

### 1. Install project dependencies

Clone the repository and open the project folder:

```bash
git clone YOUR_REPOSITORY_URL
cd primeweb
```

Create and activate a virtual environment:

**Windows:**
```powershell
python -m venv env
.\env\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Make sure `python-dotenv` is included in `requirements.txt`.

### 2. Configure environment variables

Create a `.env` file in the project root, alongside `run.py`.

Generate a Flask secret key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Generate an administrator password hash:

```bash
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash(input('Enter admin password: ')))"
```

Add the generated values to `.env`:

```env
PRIMEWEB_SECRET_KEY=your_generated_secret_key
PRIMEWEB_ADMIN_PASSWORD_HASH=your_generated_password_hash
```

Do not include quotation marks around the values.

**Security:** Never commit `.env` to GitHub. Each developer should configure their own local secret key and administrator password hash.

### 3. Start the application

Run:

```bash
python run.py
```

Open the website:

- Website: `http://127.0.0.1:5000`
- Admin login: `http://127.0.0.1:5000/admin/login`
- Admin dashboard: `http://127.0.0.1:5000/admin`

Sign in using the password used when generating your password hash.

### 4. Admin dashboard functionality

The administrator can:

- View customer contact enquiries and quote requests.
- View customer names, email addresses and project details.
- Review requested services and budgets.
- Update enquiry statuses.

Available enquiry statuses:

1. New
2. Contacted
3. Quotation Sent
4. Approved
5. In Progress
6. Completed
7. Declined

### 5. Database

Enquiries are stored in a local SQLite database:

```text
instance/primeweb.sqlite3
```

The database is automatically initialised when the Flask application starts.

Each developer's local database is separate unless a shared database is configured.

### 6. Important security notes

- Keep `.env` private and excluded from Git.
- Never commit administrator passwords, password hashes or secret keys.
- Use HTTPS and secure cookie settings in production.
- Configure production database backups and monitoring.
- The initial application supports a configured administrator password hash, not a multi-user administrator management system.
- Customer accounts, file uploads, quotation approval, invoicing and payments are not currently implemented.

**Note:** The administrator configuration is required before the dashboard can be accessed.