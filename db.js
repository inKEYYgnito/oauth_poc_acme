const Sequelize = require('sequelize');
const { UUID, UUIDV4, STRING } = Sequelize;
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db');
const jwt = require('jwt-simple');

const User = conn.define('user', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true 
  },
  name: {
    type: STRING,
    allowNull: false,
    unique: true
  },
  githubId: {
    type: STRING,
    allowNull: false
  }
});

const Login = conn.define('login', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true 
  },
});

Login.belongsTo(User);

User.findByToken = async function(token){
  try {
    const id = (jwt.decode(token, process.env.SECRET)).id; 
    const user = await this.findByPk(id);
    if(!user){
      throw ({ status: 401 });
    }
    return user;
  }
  catch(ex){
    throw ({ status: 401 });
  }
}

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  await User.create({ name: 'KeyWi', githubId: '25336223'})
};

module.exports = {
  models: {
    User,
    Login
  },
  syncAndSeed
};
