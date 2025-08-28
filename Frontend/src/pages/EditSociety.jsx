import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { AuthContext } from "@/context/AppContext";

export default function EditSociety() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    secretaryName: "",
    taluka: "",
    district: "",
    address: "",
    type: "housing",
    initialBalance: "0",
    financialYearStart: "2024-04-01",
    financialYearEnd: "2025-03-31",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch society data on mount
  useEffect(() => {
    const fetchSociety = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/societies/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const s = res.data;

        // Format dates as YYYY-MM-DD for input type=date
        const formatDate = (dateStr) =>
          dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";

        setFormData({
          name: s.society.name || "",
          secretaryName: s.society.secretaryName || "",
          taluka: s.society.taluka || "",
          district: s.society.district || "",
          address: s.society.address || "",
          type: s.society.type || "housing",
          initialBalance: s.society.initialBalance?.toString() || "0",
          financialYearStart: s.society.financialYearStart
            ? new Date(s.society.financialYearStart).toISOString().split("T")[0]
            : "2024-04-01",
          financialYearEnd: s.society.financialYearEnd
            ? new Date(s.society.financialYearEnd).toISOString().split("T")[0]
            : "2025-03-31",
        });
      } catch (err) {
        console.error("Error fetching society:", err);
        const errorMessage = err.response?.data?.message || "Failed to load society data. Please try again.";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSociety();
  }, [id, token]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Society name is required");
      return;
    }
    
    if (!formData.secretaryName.trim()) {
      toast.error("Secretary name is required");
      return;
    }

    setSaving(true);

    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/societies/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Society updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error updating society:", err);
      const errorMessage = err.response?.data?.message || "Failed to update society. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-12">Loading...</p>;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft
              onClick={() => navigate("/dashboard")}
              className="w-4 h-4"
            />
          </Button>
          <div>
            <h1>Edit Society</h1>
            <p className="text-muted-foreground">Update society information</p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1 text-center font-bold mb-5">
              <h1>संस्थेची माहिती (Society Information)</h1>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Society Name */}
              <div className="space-y-2">
                <Label htmlFor="name">संस्थेच नाव (Society Name) *</Label>
                <ReactTransliterate
                  lang="mr"
                  value={formData.name}
                  onChangeText={(txt) => handleChange("name", txt)}
                  placeholder="उदा. ए बी सी सहकारी संस्था मर्यादित चिपळूण"
                  renderComponent={(props) => (
                    <Input {...props} id="name" required />
                  )}
                />
              </div>

              {/* Secretary Name */}
              <div className="space-y-2">
                <Label htmlFor="secretary">
                  सचिवाचे नाव (Secretary Name) *
                </Label>
                <ReactTransliterate
                  lang="mr"
                  value={formData.secretaryName}
                  onChangeText={(txt) => handleChange("secretaryName", txt)}
                  placeholder="उदा. राज अशोक निकम"
                  renderComponent={(props) => (
                    <Input {...props} id="secretary" required />
                  )}
                />
              </div>

              {/* Opening Balance → Keep normal */}
              <div className="space-y-2">
                <Label htmlFor="balance">
                  आरंभी शिल्लक (Opening Balance) (₹)
                </Label>
                <Input
                  id="balance"
                  type="number"
                  value={formData.initialBalance}
                  onChange={(e) =>
                    handleChange("initialBalance", e.target.value)
                  }
                  placeholder="0"
                  step="100"
                />
              </div>

              {/* Taluka */}
              <div className="space-y-2">
                <Label htmlFor="taluka">तालुका (Taluka)</Label>
                <ReactTransliterate
                  lang="mr"
                  value={formData.taluka}
                  onChangeText={(txt) => handleChange("taluka", txt)}
                  placeholder="उदा. चिपळूण"
                  renderComponent={(props) => <Input {...props} id="taluka" />}
                />
              </div>

              {/* District */}
              <div className="space-y-2">
                <Label htmlFor="district">जिल्हा (District)</Label>
                <ReactTransliterate
                  lang="mr"
                  value={formData.district}
                  onChangeText={(txt) => handleChange("district", txt)}
                  placeholder="उदा. रत्नागिरी"
                  renderComponent={(props) => (
                    <Input {...props} id="district" />
                  )}
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">पत्ता (Address)</Label>
                <ReactTransliterate
                  lang="mr"
                  value={formData.address}
                  onChangeText={(txt) => handleChange("address", txt)}
                  placeholder="उदा. चिपळूण, रत्नागिरी"
                  renderComponent={(props) => (
                    <Textarea {...props} id="address" rows={3} />
                  )}
                />
              </div>

              <div className="space-y-3">
                <Label>संस्थेचा प्रकार (Society Type)</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={
                      formData.type === "housing" ? "default" : "outline"
                    }
                    onClick={() => handleChange("type", "housing")}
                    className="flex-1"
                  >
                    गृहनिर्माण सोसायटी (Housing Society)
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === "labour" ? "default" : "outline"}
                    onClick={() => handleChange("type", "labour")}
                    className="flex-1"
                  >
                    श्रमिक व इतर सोसायटी (Labour & Other Society)
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    आर्थिक वर्षाची सुरुवात (Financial Year Start)
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.financialYearStart}
                    onChange={(e) =>
                      handleChange("financialYearStart", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    आर्थिक वर्षाची समाप्ती (Financial Year End)
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.financialYearEnd}
                    onChange={(e) =>
                      handleChange("financialYearEnd", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="gap-3 flex justify-center mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Update Society"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
