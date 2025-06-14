import producto from '../models/producto.js';

export const crearProducto = async (req, res) => {
    try {
        const {
            codproducto,
            nombreproducto,
            modeloproducto,
            descripcionproducto
        } = req.body;

        // Verificar si ya existe un producto con el mismo código
        const productoExistente = await producto.findOne({
            where: { codproducto }
        });

        if (productoExistente) {
            return res.status(400).json({ error: 'Ya existe un producto con este código' });
        }

        // Crear el nuevo producto
        const nuevoProducto = await producto.create({
            codproducto,
            nombreproducto,
            modeloproducto,
            descripcionproducto,
            estadoproducto: 'ACTIVO'
        });

        res.status(201).json({
            message: 'Producto creado exitosamente',
            data: nuevoProducto
        });
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getProductos = async (req, res) => {
    try {
        const productos = await producto.findAll({
            where: { estadoproducto: 'ACTIVO' }
        });
        res.status(200).json(productos);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ error: error.message });
    }
}; 

export const updateProducto = async (req, res) => {
    const { id } = req.params;
    const { codigoproducto, nombreproducto, descripcionproducto } = req.body;
    try {
        await productos.update({ codigoproducto, nombreproducto, descripcionproducto }, { where: { idproductos: id } });
        res.json({ message: 'success' });
    } catch (error) {
        res.status(500).json({ error: 'Error al editar el producto' });
    }
};

export const deleteProducto = async (req, res) => {
    const { id } = req.params;
    try {
        await productos.destroy({ where: { idproductos: id } });
        res.json({ message: 'success' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
};