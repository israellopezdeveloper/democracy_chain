import asyncio

import aio_pika
from aio_pika.abc import AbstractIncomingMessage

# from worker.services.processor import process_file
from worker.core.config import RABBITMQ_QUEUE, RABBITMQ_URL


async def wait_for_rabbitmq(url, retries=10, delay=3):
    for attempt in range(retries):
        try:
            connection = await aio_pika.connect_robust(url)
            return connection
        except Exception as e:
            print(f"[⏳] RabbitMQ not ready (attempt {attempt}/{retries}): {e}")
            await asyncio.sleep(delay)
    raise RuntimeError("RabbitMQ is not available after retries.")


async def on_message(message: AbstractIncomingMessage):
    async with message.process():
        print(f"[📨] Mensaje recibido: {message.body.decode()}")
        # payload = message.body.decode()
        # print(f" [x] Received {payload}")
        # await process_file(payload)


async def main():
    connection = await wait_for_rabbitmq(RABBITMQ_URL)
    channel = await connection.channel()
    queue = await channel.declare_queue(RABBITMQ_QUEUE, durable=True)
    await queue.consume(on_message)
    print("[⏳] Esperando mensajes...")
    await asyncio.Future()  # nunca termina


if __name__ == "__main__":
    asyncio.run(main())
