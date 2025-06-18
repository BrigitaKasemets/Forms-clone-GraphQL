# FormsCloneApi REST API Endpoint'ide Analüüs

**Analüüsi kuupäev:** 18. juuni 2025

Käesolev dokument sisaldab täielikku kaardistust FormsCloneApi projekti REST API endpoint'idest, HTTP meetoditest, teedest ja payload'dest.

## Projekti ülevaade

FormsCloneApi on Google Forms kloon, mis on ehitatud Node.js ja Express.js baasil. API kasutab SQLite andmebaasi ja JWT autentimist.

## 1. **Sessions** (`/sessions`) - Autentimishaldus

### POST `/sessions` - Sisselogimine
- **HTTP meetod**: POST
- **URL**: `/sessions`
- **Autentimine**: Pole vajalik
- **Content-Type**: `application/json`
- **Payload**:
```json
{
  "email": "string (kohustuslik)",
  "password": "string (kohustuslik)"
}
```
- **Vastused**:
    - `201` - Edukas sisselogimine
      ```json
      {
        "token": "JWT_TOKEN",
        "userId": "number"
      }
      ```
    - `400` - Puuduvad kohustuslikud väljad
    - `401` - Vigased andmed
    - `500` - Serveri viga

### DELETE `/sessions` - Väljalogimine
- **HTTP meetod**: DELETE
- **URL**: `/sessions`
- **Autentimine**: Kohustuslik (Bearer token)
- **Payload**: Puudub
- **Vastused**:
    - `200` - Edukas väljalogimine
    - `500` - Serveri viga

---

## 2. **Forms** (`/forms`) - Vormide haldus

### POST `/forms` - Uue vormi loomine
- **HTTP meetod**: POST
- **URL**: `/forms`
- **Autentimine**: Kohustuslik (Bearer token)
- **Content-Type**: `application/json`
- **Payload**:
```json
{
  "title": "string (kohustuslik)",
  "description": "string (valikuline, max 500 tähemärki)"
}
```
- **Vastused**:
    - `201` - Vorm edukalt loodud
    - `400` - Valideerimise viga
    - `500` - Serveri viga

### GET `/forms` - Kõigi vormide hankimine
- **HTTP meetod**: GET
- **URL**: `/forms`
- **Autentimine**: Kohustuslik (Bearer token)
- **Payload**: Puudub
- **Vastused**:
    - `200` - Vormide nimekiri
    - `404` - Vorme ei leitud
    - `500` - Serveri viga

### GET `/forms/{id}` - Konkreetse vormi hankimine
- **HTTP meetod**: GET
- **URL**: `/forms/{id}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `id` (string) - vormi ID
- **Vastused**:
    - `200` - Vormi andmed
    - `404` - Vormi ei leitud
    - `500` - Serveri viga

### PATCH `/forms/{id}` - Vormi uuendamine
- **HTTP meetod**: PATCH
- **URL**: `/forms/{id}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `id` (string) - vormi ID
- **Payload**: Sama struktuur kui POST `/forms`
- **Vastused**:
    - `200` - Vorm edukalt uuendatud
    - `400` - Valideerimise viga
    - `404` - Vormi ei leitud
    - `500` - Serveri viga

### DELETE `/forms/{id}` - Vormi kustutamine
- **HTTP meetod**: DELETE
- **URL**: `/forms/{id}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `id` (string) - vormi ID
- **Vastused**:
    - `204` - Vorm edukalt kustutatud
    - `404` - Vormi ei leitud
    - `500` - Serveri viga

---

## 3. **Questions** (`/forms/{formId}/questions`) - Küsimuste haldus

### GET `/forms/{formId}/questions` - Vormi küsimuste hankimine
- **HTTP meetod**: GET
- **URL**: `/forms/{formId}/questions`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
- **Vastused**:
    - `200` - Küsimuste nimekiri
    - `404` - Vormi ei leitud
    - `500` - Serveri viga

### POST `/forms/{formId}/questions` - Uue küsimuse lisamine
- **HTTP meetod**: POST
- **URL**: `/forms/{formId}/questions`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
- **Payload**:
```json
{
  "text": "string (kohustuslik) - küsimuse tekst",
  "type": "string (kohustuslik) - küsimuse tüüp",
  "options": "array (kohustuslik valikuküsimuste jaoks)"
}
```
**Lubatud küsimuse tüübid:**
- `shorttext` - lühike tekst
- `paragraph` - pikk tekst
- `multiplechoice` - üks valik
- `checkbox` - mitu valikut
- `dropdown` - rippmenüü

- **Vastused**:
    - `201` - Küsimus edukalt loodud
    - `400` - Valideerimise viga
    - `404` - Vormi ei leitud
    - `500` - Serveri viga

### GET `/forms/{formId}/questions/{questionId}` - Konkreetse küsimuse hankimine
- **HTTP meetod**: GET
- **URL**: `/forms/{formId}/questions/{questionId}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
    - `questionId` (string) - küsimuse ID
- **Vastused**:
    - `200` - Küsimuse andmed
    - `404` - Küsimust ei leitud
    - `500` - Serveri viga

### PATCH `/forms/{formId}/questions/{questionId}` - Küsimuse uuendamine
- **HTTP meetod**: PATCH
- **URL**: `/forms/{formId}/questions/{questionId}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
    - `questionId` (string) - küsimuse ID
- **Payload**: Osaline küsimuse objekt
- **Vastused**:
    - `200` - Küsimus edukalt uuendatud
    - `400` - Valideerimise viga
    - `404` - Küsimust ei leitud
    - `500` - Serveri viga

### DELETE `/forms/{formId}/questions/{questionId}` - Küsimuse kustutamine
- **HTTP meetod**: DELETE
- **URL**: `/forms/{formId}/questions/{questionId}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
    - `questionId` (string) - küsimuse ID
- **Vastused**:
    - `204` - Küsimus edukalt kustutatud
    - `404` - Küsimust ei leitud
    - `500` - Serveri viga

---

## 4. **Responses** (`/forms/{formId}/responses`) - Vastuste haldus

### GET `/forms/{formId}/responses` - Vormi vastuste hankimine
- **HTTP meetod**: GET
- **URL**: `/forms/{formId}/responses`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
- **Vastused**:
    - `200` - Vastuste nimekiri
    - `404` - Vormi ei leitud
    - `500` - Serveri viga

### POST `/forms/{formId}/responses` - Uue vastuse lisamine
- **HTTP meetod**: POST
- **URL**: `/forms/{formId}/responses`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
- **Payload**:
```json
{
  "answers": [
    {
      "questionId": "string (kohustuslik) - küsimuse ID",
      "answer": "any (kohustuslik) - vastus (tüüp sõltub küsimusest)"
    }
  ],
  "respondentName": "string (valikuline) - vastaja nimi",
  "respondentEmail": "string (valikuline) - vastaja email"
}
```
- **Vastused**:
    - `201` - Vastus edukalt loodud
    - `400` - Valideerimise viga või vigane küsimuse ID
    - `404` - Vormi ei leitud
    - `500` - Serveri viga

### GET `/forms/{formId}/responses/{responseId}` - Konkreetse vastuse hankimine
- **HTTP meetod**: GET
- **URL**: `/forms/{formId}/responses/{responseId}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
    - `responseId` (string) - vastuse ID
- **Vastused**:
    - `200` - Vastuse andmed
    - `404` - Vastust ei leitud
    - `500` - Serveri viga

### PATCH `/forms/{formId}/responses/{responseId}` - Vastuse uuendamine
- **HTTP meetod**: PATCH
- **URL**: `/forms/{formId}/responses/{responseId}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
    - `responseId` (string) - vastuse ID
- **Payload**: Osaline vastuse objekt (sama struktuur kui POST)
- **Vastused**:
    - `200` - Vastus edukalt uuendatud
    - `400` - Valideerimise viga või vigane küsimuse ID
    - `404` - Vastust ei leitud
    - `500` - Serveri viga

### DELETE `/forms/{formId}/responses/{responseId}` - Vastuse kustutamine
- **HTTP meetod**: DELETE
- **URL**: `/forms/{formId}/responses/{responseId}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `formId` (string) - vormi ID
    - `responseId` (string) - vastuse ID
- **Vastused**:
    - `204` - Vastus edukalt kustutatud
    - `404` - Vastust ei leitud
    - `500` - Serveri viga

---

## 5. **Users** (`/users`) - Kasutajate haldus

### POST `/users` - Uue kasutaja registreerimine
- **HTTP meetod**: POST
- **URL**: `/users`
- **Autentimine**: Pole vajalik
- **Content-Type**: `application/json`
- **Payload**:
```json
{
  "email": "string (kohustuslik, kehtiv email formaat)",
  "password": "string (kohustuslik)",
  "name": "string (kohustuslik)"
}
```

**Parooli nõuded:**
- Vähemalt 8 tähemärki pikk
- Vähemalt 3 järgnevast 4 kategooriast:
    - Suured tähed (A-Z)
    - Väikesed tähed (a-z)
    - Numbrid (0-9)
    - Erimärgid (!@#$%^&*()_+-=[]{};"\\|,.<>/?)
- Ei tohi olla tavalistest paroolidest nimekirjas

- **Vastused**:
    - `201` - Kasutaja edukalt registreeritud
    - `400` - Valideerimise viga või parooli nõuded ei ole täidetud
    - `409` - Email juba kasutusel
    - `500` - Serveri viga

### GET `/users` - Kõigi kasutajate hankimine
- **HTTP meetod**: GET
- **URL**: `/users`
- **Autentimine**: Kohustuslik (Bearer token)
- **Vastused**:
    - `200` - Kasutajate nimekiri
    - `500` - Serveri viga

### GET `/users/{userId}` - Konkreetse kasutaja hankimine
- **HTTP meetod**: GET
- **URL**: `/users/{userId}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `userId` (string) - kasutaja ID
- **Vastused**:
    - `200` - Kasutaja andmed
    - `404` - Kasutajat ei leitud
    - `500` - Serveri viga

### PATCH `/users/{userId}` - Kasutaja andmete uuendamine
- **HTTP meetod**: PATCH
- **URL**: `/users/{userId}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `userId` (string) - kasutaja ID või "me" (enda jaoks)
- **Payload**:
```json
{
  "email": "string (valikuline, kehtiv email formaat)",
  "name": "string (valikuline)",
  "password": "string (valikuline, samad nõuded kui registreerimisel)"
}
```
- **Vastused**:
    - `200` - Kasutaja andmed edukalt uuendatud
    - `400` - Valideerimise viga
    - `404` - Kasutajat ei leitud
    - `500` - Serveri viga

### DELETE `/users/{userId}` - Kasutaja kustutamine
- **HTTP meetod**: DELETE
- **URL**: `/users/{userId}`
- **Autentimine**: Kohustuslik (Bearer token)
- **URL parameetrid**:
    - `userId` (string) - kasutaja ID või "me" (enda jaoks)
- **Vastused**:
    - `204` - Kasutaja edukalt kustutatud
    - `400` - Vigane kasutaja ID
    - `404` - Kasutajat ei leitud
    - `500` - Serveri viga

---

## 6. **Süsteemi endpoint'id**

### GET `/health` - Tervislikkuse kontroll
- **HTTP meetod**: GET
- **URL**: `/health`
- **Autentimine**: Pole vajalik
- **Vastus**:
```json
{
  "status": "OK", 
  "message": "REST API is running"
}
```

### GET `/` - Dokumentatsiooni avaleht
- **HTTP meetod**: GET
- **URL**: `/`
- **Autentimine**: Pole vajalik
- **Vastus**: HTML leht keele valimiseks

### GET `/en` - Swagger dokumentatsioon (inglise keel)
- **HTTP meetod**: GET
- **URL**: `/en`
- **Autentimine**: Pole vajalik
- **Vastus**: Swagger UI inglise keeles

### GET `/et` - Swagger dokumentatsioon (eesti keel)
- **HTTP meetod**: GET
- **URL**: `/et`
- **Autentimine**: Pole vajalik
- **Vastus**: Swagger UI eesti keeles

### GET `/api-docs` - Tagasiühilduvus
- **HTTP meetod**: GET
- **URL**: `/api-docs`
- **Autentimine**: Pole vajalik
- **Vastus**: Suunab `/en` lehele

---

## Tehnilised detailid

### Autentimine
- **Tüüp**: Bearer Token (JWT)
- **Päis**: `Authorization: Bearer <token>`
- **Token saadakse**: POST `/sessions` kaudu

### CORS seadistused
- **Lubatud päritolud**:
    - `http://localhost:3002`
    - `http://localhost:57594`
- **Lubatud meetodid**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Lubatud päised**: Content-Type, Authorization

### Veatöötlus
Kõik API endpoint'id tagastavad standardiseeritud veasõnumeid:

```json
{
  "code": 400,
  "message": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### Andmebaas
- **Tüüp**: SQLite
- **Fail**: `forms.db`
- **Asukoht**: Projekti juurkataloog

### Serveri käivitamine
```bash
# Arendusrežiim
npm run dev

# Tootmisrežiim
npm start

# Andmebaasi initsialiseerimine
npm run init-db
```

### Serveri URL
- **Arendus**: `http://localhost:3000`
- **Dokumentatsioon**:
    - Inglise: `http://localhost:3000/en`
    - Eesti: `http://localhost:3000/et`

---

## Kokkuvõte

FormsCloneApi pakub täielikku REST API funktsionaalsust vormide loomiseks, haldamiseks ja vastuste kogumiseks. API järgib RESTful disaini põhimõtteid ja kasutab hierarhilist URL struktuuri. Kõik endpoint'id on dokumenteeritud OpenAPI/Swagger formaadis kahes keeles (inglise ja eesti).

**Põhilised funktsioonid:**
- Kasutajate registreerimine ja autentimine
- Vormide loomine ja haldamine
- Küsimuste lisamine vormidele
- Vastuste kogumine ja haldamine
- Täielik CRUD funktsiοnaalsuς kõigi ressursside jaoks
- Automaatne valideerimane
- Mitmekeelne dokumentatsioon
