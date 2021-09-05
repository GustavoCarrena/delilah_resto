const sequelize = require('../database_conection/conection.js');

const insertNewOrder = (newOrder) => {
    return sequelize.query("INSERT INTO orders (user_id, payment_code, order_status_code, order_adress) VALUES(?,?,?,?)", {
        type: sequelize.QueryTypes.INSERT,
        replacements: newOrder
    });
};


const insertInOrderTable = (product) => {
    return sequelize.query("INSERT INTO order_products (order_id, product_id, product_quantity) VALUES(?,?,?)", {
        type: sequelize.QueryTypes.INSERT,
        replacements: product
    });
};

const orderSummary = (id) => {
    return sequelize.query(`SELECT o.order_id, p.product_id,p.product_name, o.product_quantity, p.product_price,(o.product_quantity * p.product_price) AS "precio total por producto"
    FROM order_products o 
    INNER JOIN products p 
    ON (o.product_id = p.product_id)
    WHERE o.order_id = ?;`,
    { type: sequelize.QueryTypes.SELECT,replacements:[id],})
};

const orderSummaryTotal = (id) => {
    return sequelize.query(`SELECT SUM(o.product_quantity * p.product_price) AS total_orden
    FROM order_products o
    INNER JOIN products p
    ON (o.product_id = p.product_id)
    WHERE o.order_id = ?;`,
    { type: sequelize.QueryTypes.SELECT, replacements:[id],})
};

const updateOrderPrice = (orderId) => {
    return sequelize.query("UPDATE orders SET total = ? WHERE order_id = ?", {
        type: sequelize.QueryTypes.UPDATE,
        replacements: orderId,
    });
}


const updateOrder = (order) => {
    return sequelize.query("UPDATE orders SET order_status_code = ?, payment_code = ? WHERE order_id = ?", {
        type: sequelize.QueryTypes.UPDATE,
        replacements: order,
    });
}

const getOrderById = (userid,orderid) =>{
    return sequelize.query("SELECT user_id, order_id FROM orders WHERE order_id = ? AND user_id = ?",{ 
        type: sequelize.QueryTypes.SELECT, 
        replacements:[userid,orderid],
    })
}

const updateOrderSatus = (order) => {
    return sequelize.query("UPDATE orders SET order_status_code = ? WHERE order_id = ?", {
        type: sequelize.QueryTypes.UPDATE,
        replacements: order,
    });
}

const cancelOrderSatus = (order) => {
    return sequelize.query("UPDATE orders SET order_status_code = 2 WHERE order_id = ?", {
        type: sequelize.QueryTypes.UPDATE,
        replacements: order,
    });
}

const orderStatusDescription = ( id ) => {
    return sequelize.query('SELECT * FROM order_status WHERE order_status_code = ?', {
            type: sequelize.QueryTypes.SELECT,
            replacements: [id]
    })
}

const getOrderFullData = ( id ) => {
    return sequelize.query('SELECT * FROM orders WHERE order_id = ?', {
            type: sequelize.QueryTypes.SELECT,
            replacements: [id]
    })
}

const getOrderByUser = ( id ) => {
    const orderCancelStatus = 2;
    const orderFinishStatus = 6;
    return sequelize.query(`SELECT u.fullname, o.order_adress, o.order_id, o.order_status_code, o.payment_code 
    FROM users u
    INNER JOIN orders o 
    ON (u.user_id = o.user_id) 
    WHERE u.user_id = ? and o.order_status_code != ${orderCancelStatus} and o.order_status_code != ${orderFinishStatus};`, {
            type: sequelize.QueryTypes.SELECT,
            replacements: [id]
    })
}

const getOrderDescription = ( payment_code,order_status_code) => {
    return sequelize.query(`SELECT o.status_id, o.payment_code, os.status_desc, pm.payment_desc 
    FROM users u
    INNER JOIN orders o 
    ON (u.user_id = o.user_id) 
    WHERE u.user_id = ? and o.order_status_code != ${orderCancelStatus} and o.order_status_code != ${orderFinishStatus};`, {
            type: sequelize.QueryTypes.SELECT,
            replacements: [payment_code,order_status_code]
    })
}

/*
select o.status_id, o.payment_code, os.status_desc, pm.payment_desc 
from orders o
join order_status os 
on (o.status_id = os.status_id)
join payment_methods pm 
on (o.payment_code = pm.payment_code) where o.status_id = 3 and o.payment_code = 2; 

*/



// const getorderByUser = (id) => {
//     return sequelize.query(`SELECT o.order_id, o.adress, p.product_price,(o.product_quantity * p.product_price) AS "total por producto"
//     FROM order_products o 
//     INNER JOIN products p 
//     ON (o.product_id = p.product_id)
//     WHERE o.order_id = ?;`,
//     { type: sequelize.QueryTypes.SELECT,
//     replacements:[id],})
// };




module.exports = {
    insertNewOrder,
    insertInOrderTable,
    orderSummary,
    orderSummaryTotal,
    updateOrder,
    updateOrderPrice,
    getOrderById,
    updateOrderSatus,
    orderStatusDescription,
    getOrderFullData,
    cancelOrderSatus,
    getOrderByUser
};



