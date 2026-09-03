import { Router } from "express";
import multer from "multer";
import { uploadDataset, deleteDataset, proxyDownloadDataset, getSampleDataset } from "../controllers/dataset.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), uploadDataset);
router.get("/download", proxyDownloadDataset);
router.get("/sample", getSampleDataset);
router.delete("/:datasetId", deleteDataset);

export const datasetRoutes = router;
