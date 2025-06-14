import {Sequelize} from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const db = new Sequelize(
    'iwrvrarh', // DB Name
    'dkhudzce', // User Name
    'thottqfohndqqgtavyqg', // Password
    {
        host: 'alpha.mkdb.sh',
        dialect: 'postgres',
        logging: false 
    }
)

export default db 