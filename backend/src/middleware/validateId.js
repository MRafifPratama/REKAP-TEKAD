export const validateId = (req, res, next) => {
  if (
    !/^[1-9][0-9]*$/.test(req.params.id) ||
    Number(req.params.id) > 4294967295
  )
    return res.status(400).json({ message: "ID tidak valid" });
  next();
};
