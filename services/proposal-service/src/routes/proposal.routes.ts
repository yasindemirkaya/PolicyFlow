import { Router } from "express";
import { ProposalController } from "../controllers/proposal.controller.js";

const router = Router();

const proposalController = new ProposalController();

router.post("/vehicle", proposalController.createVehicleProposal);
router.post("/home", proposalController.createHomeProposal);
router.post("/health", proposalController.createHealthProposal);

export default router;