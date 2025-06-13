import {Sequelize} from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const db = new Sequelize(
    process.env.DB_NAME, // DB Name
    process.env.DB_USERNAME, // User Name
    process.env.DB_PASSWORD, // Password
    {
        host: process.env.DB_HOSTNAME,
        dialect: process.env.DB_DIALECT,
        logging: true 
    }
)

export default db