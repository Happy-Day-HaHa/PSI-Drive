FROM python:3.12-slim
WORKDIR /app
COPY apps/api /app/apps/api
RUN pip install --no-cache-dir /app/apps/api
EXPOSE 8000
CMD ["uvicorn", "psi_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
