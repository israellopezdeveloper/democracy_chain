# TODO

## ✅ Soulbound Token para evitar voto múltiple

### **Idea:**

Emitir un Soulbound Token (NFT no transferible) a cada ciudadano que
haya superado un proceso de verificación de identidad off-chain (p.ej.
mediante certificado digital español). Solo las wallets que posean
este Soulbound Token podrán votar en el contrato DemocracyChain.

### 🎯 **Motivación**

- Evitar que una misma persona pueda votar con múltiples wallets.
- Mantener privacidad: no almacenar DNIs ni datos personales on-chain.
- Mantener el proceso 100% descentralizado en la parte on-chain, sin
  exponer información sensible.
- Integrar fácilmente con procesos de identificación electrónica
  oficiales (certificado FNMT, etc.).
- Uso de estándares conocidos (ERC721) para una implementación
  sencilla y segura.

### ⚙️ **Pasos para ejecutarla**

✅ **Paso 1 — Desarrollar un contrato Soulbound Token:**

- Crear un ERC721 modificando la función `transfer` para impedir la
  transferencia de tokens.
- Implementar función `mintSoulbound(address to)` accesible solo al
  backend verificador.

✅ **Paso 2 — Modificar DemocracyChain:**

- Añadir una referencia al contrato Soulbound Token (guardar su
  dirección).
- Añadir un `require` en la función `vote()` para comprobar:

  ```solidity
  require(soulboundToken.balanceOf(msg.sender) > 0, "Not verified citizen");
  ```

✅ **Paso 3 — Desarrollar backend de verificación:**

- Integrar verificación off-chain con certificado digital u otro
  método de identidad.
- Si la identidad se verifica, llamar a `mintSoulbound` para emitir el
  token en la wallet proporcionada por el ciudadano.

✅ **Paso 4 — Emitir el Soulbound Token tras la verificación:**

- Guardar en backend los hashes de DNIs (opcional) para prevenir
  múltiples verificaciones.
- Enviar notificación al ciudadano indicando que su wallet está
  autorizada para votar.

✅ **Paso 5 — Actualizar el Frontend:**

- Añadir flujo de verificación en la dApp.
- Mostrar en la UI si la wallet posee el Soulbound Token.
- Habilitar la opción de voto solo a las wallets verificadas.

✅ **Paso 6 — Pruebas:**

- Probar contratos en Hardhat con casos de:
  - Wallet con token → puede votar.
  - Wallet sin token → no puede votar.

- Comprobar comportamiento tras intento de transferir el token (debe
  fallar).

## Buscador Semántico de Programas Electorales

### 🎯 **Motivación**

Actualmente, cualquier ciudadano puede convertirse en candidato, lo
cual es deseable para la participación democrática. Sin embargo, esto
puede generar **una gran cantidad de candidatos**, haciendo muy
difícil para un votante elegir entre ellos de forma informada.

La solución es crear un **buscador inteligente**, donde el votante
pueda describir en lenguaje natural qué tipo de propuestas o valores
busca en un candidato, y recibir como resultado los **10 candidatos
cuyos programas electorales sean más afines** a su consulta.

Esto fomentará el voto informado y reducirá la “infoxicación”
política.

### 💡 **Propuesta**

- Cada candidato podrá subir su **programa electoral** (texto
  completo) a un backend.
- El backend almacenará:
  - El texto íntegro (p. ej. en una base de datos).
  - El **hash del programa** en blockchain, para garantizar
    inmutabilidad y transparencia.

- Se indexarán estos programas en **Elasticsearch** usando embeddings
  generados localmente con **SBERT**.
- Los votantes podrán escribir consultas en lenguaje natural.
- Elasticsearch devolverá los 10 programas más similares
  semánticamente.
- Opcional: Exponer esta funcionalidad como API REST o desde frontend
  directamente.

### ⚙️ **Pasos para ejecutarla**

✅ **Paso 1 — Preparar entorno local**

- Instalar Elasticsearch OSS o OpenSearch en local o servidor.
- Elegir y descargar un modelo SBERT (p. ej. `all-MiniLM-L6-v2`) desde
  Hugging Face.

✅ **Paso 2 — Indexar programas electorales**

- Crear script en Node.js o Python:
  - Tomar cada programa electoral.
  - Generar su embedding con SBERT.
  - Almacenar texto y embedding en Elasticsearch.

✅ **Paso 3 — Crear endpoint de búsqueda**

- Crear un endpoint (REST o GraphQL) que:
  - Reciba texto libre de usuario.
  - Genere embedding de la consulta con SBERT.
  - Busque en Elasticsearch por similitud de vectores.
  - Devuelva los 10 candidatos más relevantes.

✅ **Paso 4 — Blockchain integración**

- Almacenar hash del texto completo del programa electoral en la
  blockchain (e.g. mediante un mapping en DemocracyChain).
- Permitir a cualquier usuario verificar que el texto mostrado
  coincide con lo registrado en blockchain.

✅ **Paso 5 — Frontend (opcional)**

- Crear un buscador simple donde el ciudadano escriba sus preferencias
  políticas.
- Mostrar lista de candidatos más relevantes con resumen de sus
  programas.

✅ **Paso 6 — Seguridad y privacidad**

- Asegurarse de:
  - Proteger datos personales sensibles.
  - Cumplir RGPD si se almacenan datos personales de candidatos.

✅ **Paso 7 — Tests y medición de calidad**

- Testear:
  - Calidad de los embeddings.
  - Latencia de búsqueda.
  - Precisión de resultados.

- Definir métricas de relevancia:
  - Precision\@10
  - Recall
  - Mean Reciprocal Rank (MRR)

### 🔗 **Stack técnico propuesto**

- **Vector DB:** Elasticsearch OSS o OpenSearch
- **Embeddings:** SBERT (Hugging Face, local)
- **Lenguaje backend:** Node.js, Python, o ambos
- **Blockchain:** Solidity + DemocracyChain
- **Frontend:** (opcional) React, Vue, Svelte, etc.

### 🚀 **Ventajas**

- 100% **offline-capable** y gratuito si se usa SBERT local +
  Elasticsearch OSS.
- Altísima precisión en búsquedas semánticas.
- Integridad garantizada por blockchain.
- Escalable a cientos de miles de programas electorales y millones de
  consultas.
