# Getting Started with Forms Clone GraphQL API

Siin on samm-sammuline juhend API kasutamiseks.

## 1. Serveri käivitamine

```bash
# Installi sõltuvused
npm install

# Initialiseeri andmebaas
npm run init-db

# Käivita server
npm run dev
```

Server käivitub aadressil: http://localhost:4000/graphql

## 2. GraphQL Playground'i kasutamine

1. Ava brauser ja mine aadressile: http://localhost:4000/graphql
2. Sul avaneb GraphQL Playground interaktiivne keskkond
3. Vasakul poolel on päringute kirjutamise ala
4. Paremal poolel kuvatakse vastused
5. Kliki "DOCS" nupul paremas ülanurgas schema dokumentatsiooni vaatamiseks

## 3. Esimesed sammud

### Samm 1: Testi serveri tervist
```graphql
query HealthCheck {
  health {
    ... on HealthStatus {
      status
      message
      timestamp
    }
  }
}
```

### Samm 2: Registreeri kasutaja
```graphql
mutation RegisterUser {
  register(input: {
    email: "your.email@example.com"
    password: "securepassword123"
    name: "Your Name"
  }) {
    ... on User {
      id
      email
      name
      createdAt
    }
    ... on Error {
      code
      message
    }
  }
}
```

### Samm 3: Logi sisse
```graphql
mutation LoginUser {
  login(input: {
    email: "your.email@example.com"
    password: "securepassword123"
  }) {
    ... on Session {
      token
      userId
      user {
        id
        email
        name
      }
    }
    ... on Error {
      code
      message
    }
  }
}
```

**Oluline:** Kopeeri `token` väärtus, seda läheb vaja autentimist vajavate päringute jaoks!

### Samm 4: Seadista autentimine

1. GraphQL Playground'is kliki "HTTP HEADERS" (allosas)
2. Lisa järgmine header (asenda TOKEN sisselogimisest saadud tokeniga):

```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

### Samm 5: Loo vorm
```graphql
mutation CreateForm {
  createForm(input: {
    title: "Minu esimene vorm"
    description: "See on testivorm"
  }) {
    ... on Form {
      id
      title
      description
      createdAt
      questionCount
    }
    ... on Error {
      code
      message
    }
  }
}
```

### Samm 6: Lisa küsimus vormi
```graphql
mutation CreateQuestion {
  createQuestion(
    formId: "FORM_ID_FROM_PREVIOUS_STEP"
    input: {
      text: "Mis on teie lemmikvärv?"
      type: multiplechoice
      required: true
      options: ["Punane", "Sinine", "Roheline", "Kollane"]
    }
  ) {
    ... on Question {
      id
      text
      type
      required
      options
    }
    ... on Error {
      code
      message
    }
  }
}
```

### Samm 7: Vaata oma vorme
```graphql
query MyForms {
  forms {
    ... on FormsList {
      forms {
        id
        title
        description
        questionCount
        responseCount
        createdAt
        questions {
          id
          text
          type
          required
          options
        }
      }
    }
    ... on Error {
      code
      message
    }
  }
}
```

## 4. Vastuste esitamine (ei vaja autentimist)

Vastuste esitamiseks ei ole vaja autentimist - igaüks saab vormi täita:

```graphql
mutation SubmitResponse {
  createResponse(
    formId: "FORM_ID"
    input: {
      answers: [
        {
          questionId: "QUESTION_ID"
          answer: "Sinine"
        }
      ]
      respondentName: "Anonüümne vastaja"
      respondentEmail: "optional@email.com"
    }
  ) {
    ... on Response {
      id
      respondentName
      createdAt
      answers {
        question {
          text
        }
        answer
      }
    }
    ... on Error {
      code
      message
    }
  }
}
```

## 5. Võimsad päringud

GraphQL võimaldab küsida täpselt neid andmeid, mida vajad:

```graphql
query DetailedForm {
  form(id: "1") {
    ... on Form {
      id
      title
      description
      user {
        name
        email
      }
      questions {
        id
        text
        type
        required
        options
      }
      responses {
        id
        respondentName
        createdAt
        answers {
          question {
            text
          }
          answer
        }
      }
      questionCount
      responseCount
    }
  }
}
```

## 6. Veatöötlus

Kõik vastused kasutavad Union tüüpe, mis tähendab, et sa saad kas oodatud tulemuse või vea:

```graphql
mutation ExampleWithErrorHandling {
  createForm(input: {
    title: ""  # Tühi pealkiri põhjustab vea
  }) {
    ... on Form {
      id
      title
    }
    ... on Error {
      code          # Standardiseeritud veakood
      message       # Veateade
      httpStatus    # HTTP staatuskood
      details {     # Detailsed vead (nt valideerimisprobleemid)
        field
        message
        constraint
      }
    }
  }
}
```

## Abimaterjalid

- Täielik schema: Kliki GraphQL Playground'is "DOCS"
- Rohkem näiteid: [GRAPHQL_EXAMPLES.md](./GRAPHQL_EXAMPLES.md)
- Projekti dokumentatsioon: [README.md](./README.md)

## Näpunäited

1. **Kasuta muutujaid (Variables)**: Suurte päringute korral kasuta Variables sektsiooni
2. **Explore Schema**: Schema Browser aitab leida kõik saadaolevad välju ja tüübid
3. **Error Handling**: Alati kontrolli union tüüpe (`... on Error`)
4. **Authentication**: Ära unusta Authorization header'it autentimist vajavate päringute jaoks
