"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Percent,
  Globe,
  Bell,
  Receipt,
  Save,
  Loader2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { countries, getCountryByCode, type Country } from "@/lib/countries";

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [countryOpen, setCountryOpen] = useState(false);
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<Country | null>(null);

  // Parse phone number on mount
  useEffect(() => {
    const storedPhone = settings.store_phone || "";
    if (storedPhone) {
      // Try to extract country code from phone number
      const matchedCountry = countries.find((c) => storedPhone.startsWith(c.phoneCode));
      if (matchedCountry) {
        setSelectedPhoneCountry(matchedCountry);
        setPhoneNumber(storedPhone.slice(matchedCountry.phoneCode.length).trim());
      } else {
        setPhoneNumber(storedPhone);
      }
    }
    
    // Set default phone country based on store country
    if (!selectedPhoneCountry && settings.country) {
      const country = getCountryByCode(settings.country);
      if (country) {
        setSelectedPhoneCountry(country);
      }
    }
  }, []);

  const selectedCountry = settings.country ? getCountryByCode(settings.country) : null;

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: String(value),
    }));
  };

  const handleCountryChange = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    if (country) {
      setSettings((prev) => ({
        ...prev,
        country: country.code,
        currency: country.currency,
        currency_symbol: country.currencySymbol,
      }));
      // Also update phone country if not set
      if (!selectedPhoneCountry) {
        setSelectedPhoneCountry(country);
      }
    }
    setCountryOpen(false);
  };

  const handlePhoneCountryChange = (country: Country) => {
    setSelectedPhoneCountry(country);
    setPhoneCountryOpen(false);
    // Update the full phone number
    const fullPhone = country.phoneCode + " " + phoneNumber;
    updateSetting("store_phone", fullPhone.trim());
  };

  const handlePhoneNumberChange = (value: string) => {
    // Only allow numbers and spaces
    const cleaned = value.replace(/[^\d\s]/g, "");
    setPhoneNumber(cleaned);
    // Update the full phone number
    if (selectedPhoneCountry) {
      updateSetting("store_phone", (selectedPhoneCountry.phoneCode + " " + cleaned).trim());
    } else {
      updateSetting("store_phone", cleaned);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved", {
        description: "Your changes have been saved successfully",
      });

      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Information
            </CardTitle>
            <CardDescription>
              General information that will appear on receipts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                value={settings.store_name || ""}
                onChange={(e) => updateSetting("store_name", e.target.value)}
                placeholder="Happy Paws Pet Shop"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input
                id="store_address"
                value={settings.store_address || ""}
                onChange={(e) => updateSetting("store_address", e.target.value)}
                placeholder="123 Main Street, City"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <div className="flex gap-2">
                  {/* Phone Country Selector */}
                  <Popover open={phoneCountryOpen} onOpenChange={setPhoneCountryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={phoneCountryOpen}
                        className="w-[100px] justify-between px-2"
                      >
                        {selectedPhoneCountry ? (
                          <span className="flex items-center gap-1">
                            <span className="text-lg">{selectedPhoneCountry.flag}</span>
                            <span className="text-xs text-muted-foreground">
                              {selectedPhoneCountry.phoneCode}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Code</span>
                        )}
                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {countries.map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={country.name}
                                  onSelect={() => handlePhoneCountryChange(country)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedPhoneCountry?.code === country.code
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span className="text-lg mr-2">{country.flag}</span>
                                  <span className="flex-1">{country.name}</span>
                                  <span className="text-muted-foreground text-sm">
                                    {country.phoneCode}
                                  </span>
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    placeholder="555 123 4567"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="store_email"
                  type="email"
                  value={settings.store_email || ""}
                  onChange={(e) => updateSetting("store_email", e.target.value)}
                  placeholder="info@store.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Country & Currency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Country & Currency
            </CardTitle>
            <CardDescription>
              Select your country to auto-configure currency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Country Selector */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="w-full justify-between"
                  >
                    {selectedCountry ? (
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span>{selectedCountry.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select country...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[300px]">
                          {countries.map((country) => (
                            <CommandItem
                              key={country.code}
                              value={country.name}
                              onSelect={() => handleCountryChange(country.code)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  settings.country === country.code
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="text-xl mr-2">{country.flag}</span>
                              <span className="flex-1">{country.name}</span>
                              <span className="text-muted-foreground">
                                {country.currencySymbol} {country.currency}
                              </span>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Currency Display */}
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Currency Settings</span>
                {selectedCountry && (
                  <span className="text-2xl">{selectedCountry.flag}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Currency Code</Label>
                  <div className="flex items-center gap-2 p-2 rounded bg-background">
                    <span className="font-mono font-semibold text-lg">
                      {settings.currency || "USD"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Symbol</Label>
                  <div className="flex items-center gap-2 p-2 rounded bg-background">
                    <span className="font-semibold text-2xl text-primary">
                      {settings.currency_symbol || "$"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Currency is automatically set based on selected country
              </p>
            </div>

            <Separator />

            {/* Tax Rate */}
            <div className="space-y-2">
              <Label htmlFor="tax_rate" className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Default Tax Rate (%)
              </Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                value={settings.tax_rate || "8"}
                onChange={(e) => updateSetting("tax_rate", e.target.value)}
                placeholder="8.00"
              />
              <p className="text-xs text-muted-foreground">
                Applied by default to all new products
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure system alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts when stock is low
                </p>
              </div>
              <Switch
                checked={settings.low_stock_alert_enabled === "true"}
                onCheckedChange={(checked) =>
                  updateSetting("low_stock_alert_enabled", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Sales Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about important sales
                </p>
              </div>
              <Switch
                checked={settings.sales_notifications_enabled !== "false"}
                onCheckedChange={(checked) =>
                  updateSetting("sales_notifications_enabled", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receipts
            </CardTitle>
            <CardDescription>
              Customize receipt format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt_footer">Receipt Message</Label>
              <Input
                id="receipt_footer"
                value={settings.receipt_footer || ""}
                onChange={(e) => updateSetting("receipt_footer", e.target.value)}
                placeholder="Thank you for your purchase! 🐾"
              />
              <p className="text-xs text-muted-foreground">
                This message will appear at the end of each receipt
              </p>
            </div>

            {/* Receipt Preview */}
            {selectedCountry && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Price Preview</p>
                <p className="text-lg font-semibold">
                  {settings.currency_symbol || "$"}99.99 {settings.currency || "USD"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
