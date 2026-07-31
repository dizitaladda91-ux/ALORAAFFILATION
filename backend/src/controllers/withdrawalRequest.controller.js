const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/withdrawalRequest.service');

exports.create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.request(req.user.id, req.body) }));
exports.listMine = asyncHandler(async (req, res) => res.json({ success: true, data: await service.list(req.user.id, req.query.page, req.query.limit) }));
exports.cancel = asyncHandler(async (req, res) => res.json({ success: true, data: await service.cancel(req.user.id, req.params.id, req.body.notes) }));
