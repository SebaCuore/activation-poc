#!/bin/bash
set -e

BS=kafka:29092

for t in activation.requested billing.events provisioning.events activation.events; do
  for name in "$t" "$t.dlq"; do
    /opt/kafka/bin/kafka-topics.sh --bootstrap-server $BS --create --if-not-exists \
      --topic "$name" --partitions 3 --replication-factor 1 \
      --config retention.ms=604800000
  done
done

echo "Topics creados:"
/opt/kafka/bin/kafka-topics.sh --bootstrap-server $BS --list