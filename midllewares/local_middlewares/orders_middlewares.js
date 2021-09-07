const {selectProductIfExist} = require('../../model/products');
const {selectUserId,selectUserAdmin} = require('../../model/users');
const {getOrderById,orderStatusDescription,getOrderFullData} = require('../../model/orders');
const Response = require('../../classes/response');
let rta;

/*Valida que cuando se crea una orden, exista el producto*/
// const validateOrderProductData = async (req, res, next) => {

//     let {orderProducts} = req.body;

//     orderProducts.reduce((products, order_product) => {
//         let selectProduct = selectProductIfExist(order_product.product_id)
//             .then(() => {
//                 if (selectProduct.length === 0) {
//                     products.push(`product_id: ${order_product.product_id}`)
//                     console.log(`LOG idPush = ${products}`);
                   
//                 };
//             }).catch((error) => {
//                 res.status(500).send(new Response(true, 500, "No se pudo procesar la orden", error));
//             })
//     }, [])

//     if (orderProducts.length) {
//         res.status(404).send(new Response(true, 404, "Los siguientes Id de poductos solicitados son inexistentes o no están disponibles", ""));
//     } else {
//         next();
//     };
// }

const validateOrderProductData = async (req, res, next) => {
    
    let prodErr = false;
    let orderProductsArray = [];
    let {orderProducts} = req.body;
    
    for (let i = 0; i < orderProducts.length; i++) {
        try {
            let selectProduct = await selectProductIfExist(orderProducts[i].product_id);
            if (selectProduct.length === 0) {
                prodErr = true;
                orderProductsArray.push(`product_id: ${orderProducts[i].product_id}`)
            };
        } catch (error) {
            rta = new Response(true, 500, "No se pudo procesar la orden", error);
            res.status(500).send(rta);
        };
    }
    if( prodErr == true) {
        res.status(404).send(new Response(true, 404, "Los siguientes Id de poductos solicitados son inexistentes o no están disponibles", orderProductsArray));
    } else {
        next();
    };
}

const validateOrderData = (req, res, next) => {
    let orderError = false;
    let productsArray = [];
    const {order_header,orderProducts} = req.body;
    const {user_id,order_adress} = order_header
    
    if (order_header == null || orderProducts == null) {
        orderError = true;
    } else {
        productsArray = orderProducts;

        if (user_id == null || order_adress == null || user_id.length <= 0 || order_adress.length <= 0) {
            orderError = true;
        }
        
        for (let i = 0; i < productsArray.length; i++) {

            if (productsArray[i].product_id == null || productsArray[i].product_quantity == null || typeof (productsArray[i].product_id) != 'number' || typeof (productsArray[i].product_quantity) != 'number') {
                orderError = true;
                break;
            }
        }
    }

    if (!orderError) {
        next();
    } else {
        rta = new Response(true, 400, "Los campos deben contener datos válidos", "");
        res.status(400).send(rta);
    }
}


/* ========= VALIDA QUE EL USUARIO EXISTA PARA CREAR UNA ORDEN =============*/

const userIdValidate = (req, res, next) => {

    const {order_header} = req.body;

    selectUserId(order_header.user_id)
        .then(id => {
            if (id.length == 0) {
                rta = new Response(true, 401, `El usuario no se encuentra registrado`, "");
                res.status(401).send(rta);
            } else {
                next();
            }
        })
        .catch((error) => {
            rta = new Response(true, 500, "No fue posible validar el Id del usuario", error);
            res.status(500).send(rta)
        });
};

/* ========= Validacion confirmar orden: 1) los datos ingresados existan y tengan formato requerido, 2) La orden y el usuario existan =============*/

const confirmOrderDataValidate = async (req, res, next) => {
    
    let rta;
    const {order_id,user_id,payment_code} = req.body;

    try {
        
        if (order_id == null || user_id == null || payment_code == null) {
            rta = new Response(true, 400, "No se admiten campos vacíos", "");
            res.status(400).send(rta)
        } else if (typeof (order_id) != 'number' || typeof (user_id) != 'number' || typeof (payment_code) != 'number') {
            rta = new Response(true, 400, "Todos los campos deben ser numéricos", "");
            res.status(400).send(rta)
        } else if (payment_code === 1 ){
            rta = new Response(true, 400, "El tipo de pago debe ser Efectivo o Tarjeta", `payment_code no admitido = ${payment_code}`);
            res.status(400).send(rta)
        } else {
            const getOrder = await getOrderById(order_id,user_id);
            if (getOrder.length === 0){
                rta = new Response(true, 400, "La orden no existe o el usuario con el que se intenta confirmar no se corresponde con la orden", "");
                res.status(400).send(rta)
            } else {
                next();
            }
        };
    } catch (error) {
        res.status(500).send(new Response(true, 500, "No fue posible confirmar la orden", error))
    }
}

/*Validacion cambiar estado de orden: que el usuario sea administrador*/

const userAdmin = async (req,res,next) => {
    try {
        const {user_id} = req.body;
        const response = await selectUserAdmin(user_id)
        
        if (response[0].user_admin === 1 ) {
            next()
        }else{
            res.status(409).send( new Response(true, 409, ` El usuario con el Id ${JSON.stringify(user_id)} debe ser administrador para efectuar la operación y el campo no puede estar vacío`, ""));
        }        
    } catch (error) {
        res.status(500).send(new Response(true, 500, 'No se pudo realizar la operación', error));
    };
};

/*Validacion cambiar estado de orden: que el formato de datos de la orden y del estado sean validos*/


const orderStatusData = (req,res,next) => {
    try {
        const {order_status_code, order_id} = req.body;
        
        if (!order_status_code || !order_id || typeof(order_status_code) !== 'number' || typeof(order_id) !== 'number') {
            res.status(400).send( new Response(true, 400, "Los datos no pueden estar vacíos y deben ser numéricos", ""));
        } else  {
            next();
        }
    } catch (error) {
        res.status(500).send(new Response(true, 500, 'No se pudo modificar el estado de la orden', error));
    };
};

/*Validacion cambiar estado de orden: que el estado ingresado y que la orden existan*/

const orderIn = async (req,res,next) => {
    try {
        
        const {order_status_code,order_id} = req.body;
        const order_status_codeE = await orderStatusDescription(order_status_code);
        const order_idE = await getOrderFullData(order_id);
        
        if (order_status_codeE.length === 0) {
            res.status(400).send( new Response(true, 400, "El estado que desea asignar no existe", ""));
        } else if (order_idE.length === 0  ){
            res.status(400).send( new Response(true, 400, "La orden que quiere modificar no existe", ""));
        } else if (order_status_codeE[0].order_status_code === 2 || order_status_codeE[0].order_status_code === 6) {
            
            res.status(400).send( new Response(true, 400, "No se puede actualizar el estado de la orden", `La orden tiene anteriormente un estado ${order_status_codeE[0].order_status_code} =  ${order_status_codeE[0].order_status_description}`));
        }
        else{
            next();
        }
    } catch (error) {
        res.status(500).send(new Response(true, 500, 'No se pudo modificar el estado de la orden', error));

    };
};

/*Validacion cancelar orden: que el status del estado sea previamente válido para cancelar*/

const orderStatusValidate = async (req,res,next) => {
    
    try {
        const {order_id} = req.body;
        const userOrder = await getOrderFullData (order_id)
        if (userOrder[0].order_status_code === 2) {
            res.status(400).send( new Response(true, 400, `La orden ${userOrder[0].order_id} ya se encuentra cancelada`, ));
        } else if(userOrder[0].order_status_code === 6){
            res.status(400).send( new Response(true, 400, `La orden ${userOrder[0].order_id} ya se encuentra entregada`, ));
        } else {
            next()
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(new Response(true, 500, 'No fue posible realizar la operacion', error));
    }
};

/**Validacion cancelar orden:  que la orden exista y que los datos no sean nulos -  que la orden corresponda con el usuario que quiere eliminar */

const orderDataValidate = async (req, res, next) => {
    
    // let rta;
    const {order_id,user_id} = req.body;

    try {
        
        if (!user_id) {
            res.status(400).send(new Response(true, 400, "No se admiten campos vacíos", ""))
        } else if (typeof (user_id) != 'number') {
            res.status(400).send(new Response(true, 400, "Todos los campos deben ser numéricos", ""))
        } else {
            const getOrder = await getOrderById(order_id,user_id);
            const admin = await selectUserAdmin(user_id)
            if (getOrder.length === 0 && admin[0].user_admin !== 1){
                res.status(400).send(new Response(true, 400, `La orden con id ${order_id} no pertenece al usuario con el id ${user_id}` , ""))
            } else {
                next();
            }
        };
    } catch (error) {
        res.status(500).send(new Response(true, 500, "No fue posible efectuar la operación", error))
    }
}

/*Validacion cambiar estado de orden: que el usuario sea administrador*/

// const orderUserAdmin = async (req,res,next) => {
//     try {
//         const {user_id,order_id} = req.body;
//         const response = await selectUserAdmin(user_id)
//         const getOrder = await getOrderById(order_id,user_id)
        
//         if (response[0].user_admin === 1 || getOrder[0].user_id === user_id && getOrder[0].order_id === order_id) {
//             next()
//         }else{
           
//         //    console.log(`getOrder Usuario no administrador = ${getOrder}`);
           

//            res.status(200).send(new Response(false, 200, "El usuario no es admi",getOrder[0].user_id ))
//         }        
//     } catch (error) {
//         res.status(409).send( new Response(true, 409, ` El usuario con el Id ${JSON.stringify(user_id)} debe ser administrador para efectuar la operación y el campo no puede estar vacío`, ""));
//     };
// };

module.exports = {
    validateOrderProductData,
    validateOrderData,
    userIdValidate,
    confirmOrderDataValidate,
    userAdmin,
    orderStatusData,
    orderIn,
    orderStatusValidate,
    orderDataValidate,
   /* orderUserAdmin*/
};





