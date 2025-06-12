import { MongoClient, ObjectId } from "mongodb"

const uri =
  "mongodb+srv://andresbriend:Ab41153945@cluster0.sviwk2v.mongodb.net/task-manager?retryWrites=true&w=majority"

// Mejorar el manejo de la conexión a MongoDB
let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  // Si ya tenemos una conexión, la reutilizamos
  if (cachedClient && cachedDb) {
    console.log("Usando conexión a MongoDB en caché")
    return { client: cachedClient, db: cachedDb }
  }

  // Si no hay conexión, creamos una nueva
  try {
    console.log("Estableciendo nueva conexión a MongoDB")
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("task-manager")

    // Guardamos la conexión en caché
    cachedClient = client
    cachedDb = db

    console.log("Conexión a MongoDB establecida correctamente")
    return { client, db }
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error)
    throw new Error("No se pudo conectar a la base de datos")
  }
}

export async function getDb() {
  const { db } = await connectToDatabase()
  return db
}

export async function getCollection(collection: string) {
  const db = await getDb()
  return db.collection(collection)
}

export function convertToObjectId(id: string | null | undefined) {
  if (!id) {
    throw new Error("ID inválido: valor nulo o indefinido")
  }

  try {
    return new ObjectId(id)
  } catch (error) {
    console.error("Invalid ObjectId:", id)
    throw new Error("ID inválido")
  }
}

export { ObjectId }
