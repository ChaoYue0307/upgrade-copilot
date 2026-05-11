# Case Study: Django Template Upgrade Triage

Repository: [`jpadilla/django-project-template`](https://github.com/jpadilla/django-project-template)

This case study shows how Upgrade Copilot can handle Python web stack upgrades, where framework, deployment, database, static-file, and security settings are tightly connected.

## Repository Snapshot

The repo is a Django project template using Pipenv, `django-configurations`, PostgreSQL support, Gunicorn, WhiteNoise, and Debug Toolbar. At the time of review, it had 726 GitHub stars and was last updated on 2026-05-07.

Evidence from `Pipfile` and `Pipfile.lock`:

- `Django`: `==3.2.*` with lockfile version `==3.2.2`
- `django-configurations`: `==2.2`
- `django-debug-toolbar`: `==3.2.1`
- `dj-database-url`: `==0.5.0`
- `psycopg2-binary`: `==2.8.6`
- `gunicorn`: `==20.1.0`
- `whitenoise`: `==5.2.0`
- `Werkzeug`: `==1.0.1`

Current package baselines checked during the demo:

- `Django`: `6.0.5`
- `django-configurations`: `2.5.1`
- `django-debug-toolbar`: `6.3.0`
- `dj-database-url`: `3.1.2`
- `gunicorn`: `26.0.0`
- `whitenoise`: `6.12.0`

## Report Summary

- Readiness: **yellow/red**
- Primary risk: Django major-version jumps affect settings, middleware, auth models, static files, database config, and deployment
- Best first action: add or confirm generated-project smoke tests before upgrading dependencies
- Recommended shape: Django LTS path first, deployment packages separately

## What Upgrade Copilot Would Flag

High-risk areas:

- Django 3.2 to 6.0 should not be treated as a single dependency bump.
- The template uses `USE_L10N`, which was removed in newer Django versions.
- WhiteNoise storage settings and static-file behavior should be validated during framework upgrades.
- `django-debug-toolbar` and `django-extensions` should be checked against the selected Django target.
- `psycopg2-binary` and deployment packages should be separated from framework semantics.
- Pipenv lockfile updates can obscure application-level migration failures if bundled with too many package changes.

Repository-specific evidence:

- `project_name/settings.py-tpl` uses `django-configurations`.
- Settings include WhiteNoise middleware and `CompressedManifestStaticFilesStorage`.
- Settings include staging/production security flags such as HSTS and SSL redirect configuration.
- The template defines `AUTH_USER_MODEL = "users.User"`.
- Root files include `Pipfile`, `Pipfile.lock`, `Procfile`, and Heroku-style deployment signals.

## Suggested PR Plan

1. **Generated-project validation PR**

   - Generate a project from the template.
   - Run migrations, collect static files, and a minimal Django smoke test.
   - Add CI around the generated project if possible.

2. **Django 4.2 LTS migration PR**

   - Move from Django 3.2 to 4.2 first.
   - Remove settings that no longer apply, such as `USE_L10N`.
   - Validate admin, auth, custom user model, static files, and database URL parsing.

3. **Dependency compatibility PR**

   - Upgrade `django-configurations`, `django-debug-toolbar`, `django-extensions`, and `dj-database-url`.
   - Keep deployment package upgrades separate unless required.

4. **Deployment package PR**

   - Upgrade Gunicorn, WhiteNoise, PostgreSQL driver, and Werkzeug.
   - Validate Procfile behavior, static assets, and production security settings.

5. **Django 5/6 exploration PR**

   - Only after Django 4.2 is stable, evaluate the Django 5 or 6 target.
   - Capture breaking settings changes and generated-project compatibility.

## Why This Is A Good Demo

This repo shows why Upgrade Copilot should work beyond JavaScript. Python framework upgrades often fail at the boundary between framework settings, deployment defaults, database adapters, and generated template behavior.
