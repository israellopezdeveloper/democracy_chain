FROM rabbitmq:3-management

# Crea un usuario no root
RUN groupadd -g 1001 clistenes && \
    useradd -u 1001 -g clistenes -m clistenes

# Cambia permisos de las rutas necesarias para RabbitMQ
RUN chown -R clistenes:clistenes /var/lib/rabbitmq /etc/rabbitmq /var/log/rabbitmq

# Cambia al usuario no root
USER clistenes

# Puertos expuestos por defecto
EXPOSE 5672 15672

