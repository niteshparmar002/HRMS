FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django project
COPY backend/ .

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Migrate then start gunicorn
CMD sh -c "python manage.py migrate && gunicorn hrms_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2"
