 
from dotenv import load_dotenv

load_dotenv()

import json
import os
from datetime import datetime, timezone
from urllib.parse import quote_plus

import paho.mqtt.client as mqtt
from pymongo import MongoClient

# MongoDB
MONGODB_HOST = os.getenv("MONGODB_HOST", "35.226.64.52")
MONGODB_PORT = int(os.getenv("MONGODB_PORT", "27018"))
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "grupo4")
MONGODB_USER = os.getenv("MONGODB_USER", "root")
MONGODB_PASSWORD = os.getenv("MONGODB_PASSWORD")
MONGODB_AUTH_SOURCE = os.getenv("MONGODB_AUTH_SOURCE", "admin")

if not MONGODB_PASSWORD:
    raise ValueError("Configure a variável MONGODB_PASSWORD.")

mongo_uri = (
    f"mongodb://{quote_plus(MONGODB_USER)}:"
    f"{quote_plus(MONGODB_PASSWORD)}@"
    f"{MONGODB_HOST}:{MONGODB_PORT}/"
    f"?authSource={quote_plus(MONGODB_AUTH_SOURCE)}"
)

mongo = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
db = mongo[MONGODB_DATABASE]
colecao = db["historico_sensores"]

# MQTT
MQTT_HOST = os.getenv("MQTT_HOST", "35.226.64.52")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1884"))
MQTT_USER = os.getenv("MQTT_USER", "sensores")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "fazenda/grupo4/#")


def ao_conectar(client, userdata, flags, reason_code, properties):
    if reason_code.is_failure:
        print(f"Falha na conexão MQTT: {reason_code}")
        return

    print("Conectado ao broker MQTT.")
    client.subscribe(MQTT_TOPIC, qos=1)
    print(f"Inscrito em: {MQTT_TOPIC}")


def ao_receber(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        payload = {
            "raw": msg.payload.decode("utf-8", errors="replace")
        }

    documento = {
        "topico": msg.topic,
        "payload": payload,
        "recebido_em": datetime.now(timezone.utc)
    }

    try:
        resultado = colecao.insert_one(documento)
        print(f"Salvo: {msg.topic} | ID: {resultado.inserted_id}")
    except Exception as erro:
        print(f"Erro ao gravar no MongoDB: {erro}")


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

if MQTT_PASSWORD:
    client.username_pw_set(MQTT_USER, MQTT_PASSWORD)

client.on_connect = ao_conectar
client.on_message = ao_receber

try:
    mongo.admin.command("ping")
    print(f"MongoDB conectado: {MONGODB_DATABASE}")

    client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
    client.loop_forever()

except KeyboardInterrupt:
    print("Encerrando o gravador.")

except Exception as erro:
    print(f"Erro: {erro}")

finally:
    client.disconnect()
    mongo.close()