FROM python:3.12-slim
WORKDIR /app
COPY workers /app/workers
RUN pip install --no-cache-dir /app/workers
CMD ["celery", "-A", "psi_workers.celery_app", "worker", "--loglevel=info", "--concurrency=2"]
