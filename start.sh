#!/bin/bash
set -e

cd backend
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
exec gunicorn hrms_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2
