const {insertNewProduct} = require('../../../model/products');
const Response = require('../../../classes/response.js');
let rta;

async function productCreate(req, res) {
    try {
        const {product_name,product_description,product_price,product_disponibilty} = req.body;
        let insert = await insertNewProduct([product_name,product_description,product_price,product_disponibilty]);
        rta = new Response(false, 200, "Plato creado exitosamente", `Se ha creado el plato ${product_name} con el identificador ${insert[0]}`);
        res.status(200).send(rta)
    } catch (error) {
        rta = new Response(true, 500, "No fue posible crear el plato", error);
        res.status(500).send(rta)
    };
};

module.exports = productCreate;