-- CreateIndex
CREATE INDEX "appointments_tenantId_startTime_status_idx" ON "appointments"("tenantId", "startTime", "status");

-- CreateIndex
CREATE INDEX "invoices_tenantId_status_issueDate_idx" ON "invoices"("tenantId", "status", "issueDate");

-- CreateIndex
CREATE INDEX "patients_tenantId_createdAt_idx" ON "patients"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_tenantId_status_receivedAt_idx" ON "payments"("tenantId", "status", "receivedAt");

-- CreateIndex
CREATE INDEX "treatment_history_tenantId_date_idx" ON "treatment_history"("tenantId", "date");

-- CreateIndex
CREATE INDEX "treatment_history_tenantId_providerId_idx" ON "treatment_history"("tenantId", "providerId");
