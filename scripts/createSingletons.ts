import { getCliClient } from 'sanity/cli'

/**
 * This script will create one or many "singleton" documents for each language
 * It works by appending the language ID to the document ID
 * and creating the translations.metadata document
 *
 * 1. Take a backup of your dataset with:
 * `npx sanity@latest dataset export`
 *
 * 2. Copy this file to the root of your Sanity Studio project
 *
 * 3. Update the SINGLETONS and LANGUAGES constants to your needs
 *
 * 4. Run the script (replace <schema-type> with the name of your schema type):
 * npx sanity@latest exec ./createSingletons.ts --with-user-token
 *
 * 5. Update your desk structure to use the new documents
 */

const SINGLETONS = [
  { id: 'home', _type: 'page', title: 'Home' },
  { id: 'login', _type: 'page', title: 'Login' },
]
const LANGUAGES = [
  { id: `en`, title: `English` },
  { id: `fr`, title: `French` },
]

// This will use the client configured in ./sanity.cli.ts
const client = getCliClient()

async function createSingletons() {
  const documents = SINGLETONS.map((singleton) => {
    const markets = LANGUAGES.map((language) => ({
      _id: `${singleton.id}-${language.id}`,
      _type: singleton._type,
      language: language.id,
    }))

    const metadata = {
      _id: `${singleton.id}-market-metadata`,
      _type: `market.metadata`,
      markets: markets.map((market) => ({
        _key: market.language,
        value: {
          _type: 'reference',
          _ref: market._id,
        }
      })),
      schemaTypes: Array.from(
        new Set(markets.map((market) => market._type))
      ),
    }

    return [metadata, ...markets]
  }).flat()

  const transaction = client.transaction()

  documents.forEach((doc) => {
    transaction.createOrReplace(doc)
  })

  await transaction
    .commit()
    .then((res) => { 
    })
    .catch((err) => {
      console.error(err)
    })
}

createSingletons()
