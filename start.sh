#!/bin/bash
set -e

cd backend
python3 -m pip install -r requirements.txt
python3 manage.py collectstatic --noinput
python3 manage.py migrate
exec python3 -m gunicorn hrms_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2
