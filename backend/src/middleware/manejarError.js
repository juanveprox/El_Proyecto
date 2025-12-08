
const manejarError = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        message: err.message,
        // stack: process.env.NODE_ENV === "produccion" ? null : err.stack,
        path: req.path,
        method: req.method
    });
};

module.exports = manejarError;