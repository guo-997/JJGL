const { Sequelize } = require('sequelize');
require('dotenv').config();

// 创建数据库连接实例
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'nfc_home_manager',
  
  // 连接池配置
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  // 日志配置
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // 时区配置
  timezone: '+08:00',
  
  // 定义默认配置
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL数据库连接成功');
  } catch (error) {
    console.error('❌ MySQL数据库连接失败:', error);
  }
};

// 同步数据库（创建表）
const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // 开发环境：如果表结构变化，修改表
      await sequelize.sync({ alter: true });
    } else {
      // 生产环境：只创建不存在的表
      await sequelize.sync();
    }
    console.log('✅ 数据库同步成功');
  } catch (error) {
    console.error('❌ 数据库同步失败:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
}; 