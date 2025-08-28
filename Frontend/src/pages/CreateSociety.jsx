import React, { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";

export default function CreateSociety({
  society,
  onSave = () => {},
  onCancel = () => {},
}) {
  const [formData, setFormData] = useState({
    name: society?.name || "",
    secretaryName: society?.secretaryName || "",
    taluka: society?.taluka || "",
    district: society?.district || "",
    address: society?.address || "",
    type: society?.type || "housing",
    initialBalance: society?.initialBalance?.toString() || "0",
    financialYearStart: society?.financialYearStart,
    financialYearEnd: society?.financialYearEnd,
  });

  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      let res;
      if (society) {
        res = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/societies/${society._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Society updated successfully!");
      } else {
        res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/societies/create-society`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Society created successfully!");
      }
      onSave(res.data);
    } catch (err) {
      console.error("Error saving society:", err);
      const errorMessage = err.response?.data?.message || "Failed to save society. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1>{society ? "Edit Society" : "Add New Society"}</h1>
            <p className="text-muted-foreground">
              {society
                ? "Update society information"
                : "Create a new society for accounting management"}
            </p>
          </div>
        </div>
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1 text-center font-bold mb-5">
              <h1>संस्थेची माहिती (Society Information)</h1>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">संस्थेच नाव (Society Name) *</Label>
                <ReactTransliterate
                  id="name"
                  lang="mr"
                  value={formData.name}
                  onChangeText={(text) => handleChange("name", text)}
                  placeholder="उदा. ए बी सी सहकारी संस्था मर्यादित चिपळूण"
                  required
                  renderComponent={(props) => <Input {...props} />}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="secretary">
                    सचिवाचे नाव (Secretary Name) *
                  </Label>
                  <ReactTransliterate
                    id="secretary"
                    lang="mr"
                    value={formData.secretaryName}
                    onChangeText={(text) => handleChange("secretaryName", text)}
                    placeholder="उदा. राज अशोक निकम"
                    required
                    renderComponent={(props) => <Input {...props} />}
                  />
                </div>
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
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taluka">तालुका (Taluka)</Label>
                  <ReactTransliterate
                    id="taluka"
                    lang="mr"
                    value={formData.taluka}
                    onChangeText={(text) => handleChange("taluka", text)}
                    placeholder="उदा. चिपळूण"
                    renderComponent={(props) => <Input {...props} />}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">जिल्हा (District)</Label>
                  <ReactTransliterate
                    id="district"
                    lang="mr"
                    value={formData.district}
                    onChangeText={(text) => handleChange("district", text)}
                    placeholder="उदा. रत्नागिरी"
                    renderComponent={(props) => <Input {...props} />}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">पत्ता (Address)</Label>
                <ReactTransliterate
                  id="address"
                  lang="mr"
                  value={formData.address}
                  onChangeText={(text) => handleChange("address", text)}
                  placeholder="उदा. चिपळूण, रत्नागिरी"
                  renderComponent={(props) => <Textarea {...props} rows={3} />}
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
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : society
                  ? "Update Society"
                  : "Create Society"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

CreateSociety.propTypes = {
  society: PropTypes.object,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};
