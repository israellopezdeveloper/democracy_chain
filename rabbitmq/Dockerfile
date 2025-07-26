FROM rabbitmq:3-management

ARG RABBITMQ_USER
ARG RABBITMQ_PASSWORD

COPY rabbitmq.conf.template /tmp/rabbitmq.conf
COPY definitions.json.template /tmp/definitions.json

RUN set -eux; \
    SALT=$(head -c 4 /dev/urandom | base64); \
    HASH=$(erl -noshell -eval " \
      Salt = base64:decode(\"$SALT\"), \
      Hash = crypto:hash(sha256, <<Salt/binary, <<\"$RABBITMQ_PASSWORD\">>/binary>>), \
      Full = <<Salt/binary, Hash/binary>>, \
      io:format(\"~s\", [base64:encode(Full)]), halt().") && \
    sed "s|__USERNAME__|$RABBITMQ_USER|g; s|__PASSWORD__|$RABBITMQ_PASSWORD|g" /tmp/rabbitmq.conf > /etc/rabbitmq/rabbitmq.conf && \
    sed "s|__USERNAME__|$RABBITMQ_USER|g; s|__PASSWORD_HASH__|$HASH|g" /tmp/definitions.json > /etc/rabbitmq/definitions.json

RUN groupadd -g 1001 clistenes && \
    useradd -u 1001 -g clistenes -m clistenes && \
    chown -R clistenes:clistenes /var/lib/rabbitmq /etc/rabbitmq /var/log/rabbitmq

USER clistenes

