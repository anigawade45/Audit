import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileText,
  Edit,
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  DashboardSkeleton,
  EmptyStateSkeleton,
} from "@/components/DashboardSkeleton";
import { cn } from "@/lib/utils";

export default function Dashboard({
  onSelectSociety,
  onEditSociety,
  onViewReports,
}) {
  const { token } = useContext(AuthContext);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterType, setFilterType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchSocieties = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/societies/allSocieties`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.societies || [];
      setSocieties(data);
    } catch (err) {
      console.error("Failed to fetch societies:", err);
      setError("Failed to load societies. Please try again.");
      setSocieties([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSocieties();
  }, [fetchSocieties]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSocieties();
  };

  const filteredSocieties = societies
    .filter((society) => {
      const matchesSearch =
        society.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        society.secretaryName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        society.address?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterType === "all" || society.type === filterType;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "date":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

  const getSocietyStats = () => {
    const total = societies.length;
    const labourCount = societies.filter((s) => s.type === "labour").length;
    const housingCount = societies.filter((s) => s.type === "housing").length;

    return { total, labourCount, housingCount };
  };

  const stats = getSocietyStats();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-black font-bold text-3xl">
              Manage your societies and accounts
            </h1>
            <p className="text-muted-foreground">
              (तुमच्या सोसायटी आणि खाती व्यवस्थापित करा)
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Error Loading Societies
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw
              className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
            />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-black font-bold text-3xl mb-2">
            Manage your societies and accounts
          </h1>
          <p className="text-muted-foreground">
            (तुमच्या सोसायटी आणि खाती व्यवस्थापित करा)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search societies, secretaries, or locations..."
              className="pl-10 pr-4 py-2 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            onClick={() => navigate("/create-society")}
            className="gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Society
          </Button>
        </div>
      </div>

      {/* Statistics and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Societies</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.labourCount}
          </div>
          <div className="text-sm text-muted-foreground">Labour Societies</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {stats.housingCount}
          </div>
          <div className="text-sm text-muted-foreground">Housing Societies</div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Filter & Sort</div>
          </div>
          <Filter className="w-4 h-4 text-muted-foreground" />
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="labour">Labour Societies</option>
            <option value="housing">Housing Societies</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="date">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Societies Grid */}
      {societies.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Societies Added</h3>
          <p className="text-muted-foreground mb-4">
            Start by adding your first society to manage accounts
          </p>
          <Button onClick={() => navigate("/create-society")}>
            Add Your First Society
          </Button>
        </div>
      ) : filteredSocieties.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Societies Found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setFilterType("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredSocieties.length} of {societies.length} societies
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSocieties.map((society) => (
              <Card
                key={society._id}
                className="hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-100 hover:border-primary/20 group"
              >
                <CardHeader className="flex justify-between items-start pb-0">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-semibold mb-1 truncate"
                      title={society.name}
                    >
                      {society.name}
                    </h3>
                    <Badge
                      variant={
                        society.type === "labour" ? "default" : "secondary"
                      }
                      className="uppercase text-xs py-1 px-2"
                    >
                      {society.type === "labour"
                        ? "श्रमिक व इतर सोसायटी"
                        : "गृहनिर्माण सोसायटी"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/edit-society/${society._id}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit Society"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </CardHeader>

                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Secretary
                      </p>
                      <p
                        className="text-sm font-medium truncate"
                        title={society.secretaryName}
                      >
                        {society.secretaryName || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Financial Year
                      </p>
                      <p className="text-sm">
                        {society.financialYearStart && society.financialYearEnd
                          ? `${dayjs(society.financialYearStart).format(
                              "DD/MM/YYYY"
                            )} – ${dayjs(society.financialYearEnd).format(
                              "DD/MM/YYYY"
                            )}`
                          : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Location
                      </p>
                      <p
                        className="text-sm line-clamp-2"
                        title={society.address}
                      >
                        {society.address || "Address not specified"}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 flex justify-between">
                  <Button asChild variant="default" size="sm" className="gap-2">
                    <Link to={`/reports/${society._id}`}>
                      <FileText className="w-4 h-4" />
                      Reports
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
