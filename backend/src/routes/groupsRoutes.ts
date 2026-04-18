import { Router } from "express";
import {
    approveGroup,
    approveJoinRequest,
    completeGroup,
    listGroups,
    rejectJoinRequest,
    requestJoinGroup,
} from "../controllers/groupsController.js";

const router = Router();

router.get("/groups", listGroups);
router.post("/groups/:id/join-requests", requestJoinGroup);
router.post("/groups/:id/requests/:userId/approve", approveJoinRequest);
router.post("/groups/:id/requests/:userId/reject", rejectJoinRequest);
router.post("/groups/:id/approve", approveGroup);
router.post("/groups/:id/complete", completeGroup);

export default router;
