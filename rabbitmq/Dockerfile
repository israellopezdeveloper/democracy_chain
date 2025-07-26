FROM rabbitmq:3-management

# Crea un usuario no root
RUN groupadd -g 1001 clistenes && \
    useradd -u 1001 -g clistenes -m clistenes

# Puertos expuestos por defecto
EXPOSE 5672 15672

COPY init.sh /init.sh
RUN chmod +x /init.sh

CMD ["/init.sh"]

