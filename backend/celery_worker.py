from celery import Celery

from app.config.settings import Settings


settings = Settings()
celery_app = Celery("parapharmacie", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery_app.conf.update(task_serializer="json", result_serializer="json", accept_content=["json"], timezone="UTC")


@celery_app.task(name="tasks.ping")
def ping() -> str:
    return "pong"
