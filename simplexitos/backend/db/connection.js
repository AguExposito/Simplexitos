import {Sequelize} from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

// DB_NAME=iwrvrarh DB_USERNAME=dkhudzce DB_PASSWORD=thottqfohndqqgtavyqg DB_HOSTNAME=alpha.mkdb.sh DB_DIALECT=postgres DATABASE_URL=postgresql://dkhudzce:thottqfohndqqgtavyqg@alpha.mkdb.sh:5432/iwrvrarh


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

