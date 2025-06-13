import productos from '../models/productos.js';

export const getAllproductos = async (req, res) => {
    try {
        const allproductos = await productos.findAll();
        res.json(allproductos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
};

export const createProducto = async (req, res) => {
    const { codigoproducto, nombreproducto, descripcionproducto } = req.body;
    try {
        const nuevoproducto = await productos.create({ codigoproducto, nombreproducto, descripcionproducto });
        res.status(201).json({ message: 'success', producto: nuevoproducto });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el producto' });
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
