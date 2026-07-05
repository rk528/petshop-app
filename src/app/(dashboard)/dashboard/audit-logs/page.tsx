"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  entityType: string;
  entityId: string;
  entityName: string | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changedFields: string[];
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionIcons = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
};

const actionColors = {
  CREATE: "bg-emerald-500",
  UPDATE: "bg-blue-500",
  DELETE: "bg-red-500",
};

const actionBadgeVariants: Record<string, "default" | "secondary" | "destructive"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filters
  const [entityType, setEntityType] = useState<string>("__all__");
  const [action, setAction] = useState<string>("__all__");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (entityType && entityType !== "__all__") params.set("entityType", entityType);
      if (action && action !== "__all__") params.set("action", action);

      const response = await fetch(`/api/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityType, action]);

  const filteredLogs = searchQuery
    ? logs.filter(
        (log) =>
          log.entityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.entityType.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logs;

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const renderChanges = (log: AuditLog) => {
    if (log.action === "CREATE") {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-600">New Record Created</p>
          {log.newData && (
            <div className="grid gap-2">
              {Object.entries(log.newData)
                .filter(([key]) => !["id", "createdAt", "updatedAt", "products"].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="font-medium text-muted-foreground w-32">{key}:</span>
                    <span className="text-foreground">{formatFieldValue(value)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      );
    }

    if (log.action === "DELETE") {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-red-600">Record Deleted</p>
          {log.previousData && (
            <div className="grid gap-2">
              {Object.entries(log.previousData)
                .filter(([key]) => !["id", "createdAt", "updatedAt", "products"].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="font-medium text-muted-foreground w-32">{key}:</span>
                    <span className="text-foreground line-through opacity-50">
                      {formatFieldValue(value)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      );
    }

    // UPDATE
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-blue-600">
          {log.changedFields.length} field{log.changedFields.length !== 1 ? "s" : ""} changed
        </p>
        <div className="space-y-2">
          {log.changedFields.map((field) => (
            <div key={field} className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">{field}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  {formatFieldValue(log.previousData?.[field])}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  {formatFieldValue(log.newData?.[field])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all changes made to your data
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {pagination?.total || 0} total entries
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Category">Category</SelectItem>
                <SelectItem value="Promotion">Promotion</SelectItem>
                <SelectItem value="Supplier">Supplier</SelectItem>
                <SelectItem value="Sale">Sale</SelectItem>
                <SelectItem value="Purchase">Purchase</SelectItem>
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Actions</SelectItem>
                <SelectItem value="CREATE">Created</SelectItem>
                <SelectItem value="UPDATE">Updated</SelectItem>
                <SelectItem value="DELETE">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-3 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const Icon = actionIcons[log.action];
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={actionBadgeVariants[log.action]}>
                            <Icon className="h-3 w-3 mr-1" />
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.entityType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.entityName || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.userName || "System"}
                        </TableCell>
                        <TableCell>
                          {log.action === "UPDATE" ? (
                            <span className="text-sm text-muted-foreground">
                              {log.changedFields.length} field{log.changedFields.length !== 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && (
                <>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${actionColors[selectedLog.action]}`}>
                    {(() => {
                      const Icon = actionIcons[selectedLog.action];
                      return <Icon className="h-4 w-4 text-white" />;
                    })()}
                  </div>
                  <span>{selectedLog.entityType} {selectedLog.action.toLowerCase()}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Entity</p>
                    <p className="font-medium">{selectedLog.entityName || selectedLog.entityId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Changed By</p>
                    <p className="font-medium">{selectedLog.userName || "System"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {format(new Date(selectedLog.createdAt), "MMMM dd, yyyy 'at' HH:mm:ss")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entity ID</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{selectedLog.entityId}</code>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Changes</h4>
                  {renderChanges(selectedLog)}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
