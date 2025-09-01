from __future__ import annotations

import json
import os
from typing import Any

import aio_pika

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/democracy")
RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE", "democracy")


async def send_message(message: dict[str, Any]) -> None:
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    async with connection:
        channel = await connection.channel()
        await channel.declare_queue(RABBITMQ_QUEUE, durable=True)
        await channel.default_exchange.publish(
            aio_pika.Message(body=json.dumps(message).encode()),
            routing_key=RABBITMQ_QUEUE,
        )
