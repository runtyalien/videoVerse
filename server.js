const app = require('./app');
const { sequelize } = require('./config/database');

const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
    app.listen( PORT, () => {
        console.log(`Server running at ${PORT}`);
    });
});