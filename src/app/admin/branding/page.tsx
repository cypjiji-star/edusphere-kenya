"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Palette,
  Upload,
  Eye,
  Save,
  Moon,
  Sun,
  Image as ImageIcon,
  RefreshCw,
  Type,
  History,
  Loader2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Form, FormDescription } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { firestore, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const ColorPicker = ({
  label,
  color,
  setColor,
}: {
  label: string;
  color: string;
  setColor: (color: string) => void;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex items-center gap-2">
      <div
        className="w-10 h-10 rounded-md border"
        style={{ backgroundColor: color }}
      />
      <Input
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-full"
      />
    </div>
  </div>
);

const googleFonts = [
  { name: "Inter", family: "Inter, sans-serif" },
  { name: "Playfair Display", family: "'Playfair Display', serif" },
  { name: "Roboto", family: "Roboto, sans-serif" },
  { name: "Lato", family: "Lato, sans-serif" },
  { name: "PT Sans", family: "'PT Sans', sans-serif" },
];

const defaultTheme = {
  primaryColor: "#2563eb",
  accentColor: "#f59e0b",
  backgroundColor: "#0f172a",
  headlineFont: googleFonts[1].family,
  bodyFont: googleFonts[4].family,
};

export default function BrandingPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);
  const [logoUrl, setLogoUrl] = React.useState(
    "https://picsum.photos/seed/school-logo/200",
  );
  const [coverImageUrl, setCoverImageUrl] = React.useState(
    "https://picsum.photos/seed/login-bg/1200/1800",
  );
  const [primaryColor, setPrimaryColor] = React.useState(
    defaultTheme.primaryColor,
  );
  const [accentColor, setAccentColor] = React.useState(
    defaultTheme.accentColor,
  );
  const [backgroundColor, setBackgroundColor] = React.useState(
    defaultTheme.backgroundColor,
  );
  const [headlineFont, setHeadlineFont] = React.useState(
    defaultTheme.headlineFont,
  );
  const [bodyFont, setBodyFont] = React.useState(defaultTheme.bodyFont);

  const form = useForm();

  React.useEffect(() => {
    if (!schoolId) return;

    const brandingRef = doc(firestore, "schoolProfile", schoolId);
    const unsubscribe = onSnapshot(brandingRef, (brandingSnap) => {
      if (brandingSnap.exists()) {
        const data = brandingSnap.data();
        setLogoUrl(
          data.logoUrl || "https://picsum.photos/seed/school-logo/200",
        );
        setCoverImageUrl(
          data.coverImageUrl || "https://picsum.photos/seed/login-bg/1200/1800",
        );
        setPrimaryColor(data.primaryColor || defaultTheme.primaryColor);
        setAccentColor(data.accentColor || defaultTheme.accentColor);
        setBackgroundColor(
          data.backgroundColor || defaultTheme.backgroundColor,
        );
        setHeadlineFont(data.headlineFont || defaultTheme.headlineFont);
        setBodyFont(data.bodyFont || defaultTheme.bodyFont);
      }
    });

    return () => unsubscribe();
  }, [schoolId]);

  const previewStyle = {
    "--preview-primary": primaryColor,
    "--preview-accent": accentColor,
    "--preview-background": backgroundColor,
    "--preview-foreground": "#f8fafc",
    "--preview-card": "#1e293b", // A slightly lighter shade for the card
    "--preview-muted": "#334155",
    "--preview-muted-foreground": "#94a3b8",
    "--preview-font-headline": headlineFont,
    "--preview-font-body": bodyFont,
  } as React.CSSProperties;

  const applyTheme = (theme: typeof defaultTheme) => {
    setPrimaryColor(theme.primaryColor);
    setAccentColor(theme.accentColor);
    setBackgroundColor(theme.backgroundColor);
    setHeadlineFont(theme.headlineFont);
    setBodyFont(theme.bodyFont);
  };

  const handleReset = () => {
    applyTheme(defaultTheme);
    toast({
      title: "Theme Reset",
      description: `The theme has been reset to the system default.`,
    });
  };

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !schoolId) return;

    setIsUploadingLogo(true);
    toast({
      title: "Uploading Logo...",
      description: "Please wait while the new logo is being uploaded.",
    });

    try {
      const storagePath = `schools/${schoolId}/assets/logo_${Date.now()}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setLogoUrl(downloadURL);
      await setDoc(
        doc(firestore, "schoolProfile", schoolId),
        { logoUrl: downloadURL },
        { merge: true },
      );

      toast({
        title: "Logo Updated!",
        description: "The new school logo has been saved.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload the logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !schoolId) return;

    setIsUploadingCover(true);
    toast({
      title: "Uploading Cover Image...",
      description: "This may take a moment.",
    });

    try {
      const storagePath = `schools/${schoolId}/assets/cover_${Date.now()}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setCoverImageUrl(downloadURL);
      await setDoc(
        doc(firestore, "schoolProfile", schoolId),
        { coverImageUrl: downloadURL },
        { merge: true },
      );

      toast({
        title: "Cover Image Updated!",
        description: "The new login page cover has been saved.",
      });
    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload the cover image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!schoolId) return;
    setIsLoading(true);
    const brandingData = {
      primaryColor,
      accentColor,
      backgroundColor,
      headlineFont,
      bodyFont,
    };

    try {
      await setDoc(doc(firestore, "schoolProfile", schoolId), brandingData, {
        merge: true,
      });

      toast({
        title: "Theme Saved!",
        description:
          "Your new branding has been applied. Reloading to see changes.",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Error saving theme:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the theme to the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <Palette className="h-8 w-8 text-primary" />
          Branding & Customization
        </h1>
        <p className="text-muted-foreground">
          Tailor the school portal to match your brand identity.
        </p>
      </div>

      <Tabs defaultValue="customize">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="customize">Customize</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="preview" className="hidden md:inline-flex">
            Live Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="customize" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>School Logo & Media</CardTitle>
                <CardDescription>
                  Upload your school's logo and cover image.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-6">
                    <div className="space-y-2">
                      <Label>School Logo</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={logoUrl} />
                          <AvatarFallback>SL</AvatarFallback>
                        </Avatar>
                        <Button asChild variant="outline" className="w-full">
                          <Label
                            htmlFor="logo-upload"
                            className="cursor-pointer"
                          >
                            {isUploadingLogo ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload New Logo
                              </>
                            )}
                          </Label>
                        </Button>
                        <Input
                          id="logo-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoChange}
                          disabled={isUploadingLogo}
                        />
                      </div>
                      <FormDescription>
                        Recommended format: PNG or SVG.
                      </FormDescription>
                    </div>
                    <div className="space-y-2">
                      <Label>Login Page Cover Image</Label>
                      <Card className="overflow-hidden w-full">
                        <CardContent className="p-0">
                          <div className="relative aspect-video w-full">
                            <Image
                              src={coverImageUrl}
                              alt="Cover Image Preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </CardContent>
                        <CardFooter className="p-2 bg-muted/50">
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="w-full"
                          >
                            <Label
                              htmlFor="cover-image-upload"
                              className="cursor-pointer"
                            >
                              {isUploadingCover ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload New Cover Image
                                </>
                              )}
                            </Label>
                          </Button>
                          <Input
                            id="cover-image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleCoverImageChange}
                            disabled={isUploadingCover}
                          />
                        </CardFooter>
                      </Card>
                      <FormDescription>
                        This image is shown on the dashboard login page
                        (1920x1080px recommended).
                      </FormDescription>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the portal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ColorPicker
                    label="Primary Color"
                    color={primaryColor}
                    setColor={setPrimaryColor}
                  />
                  <ColorPicker
                    label="Accent Color"
                    color={accentColor}
                    setColor={setAccentColor}
                  />
                  <ColorPicker
                    label="Background Color"
                    color={backgroundColor}
                    setColor={setBackgroundColor}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-primary" />
                    Typography
                  </CardTitle>
                  <CardDescription>
                    Select fonts for headings and body text.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="headline-font">Headline Font</Label>
                    <Select
                      value={headlineFont}
                      onValueChange={setHeadlineFont}
                    >
                      <SelectTrigger id="headline-font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {googleFonts.map((font) => (
                          <SelectItem
                            key={font.name}
                            value={font.family}
                            style={{ fontFamily: font.family }}
                          >
                            {font.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body-font">Body Font</Label>
                    <Select value={bodyFont} onValueChange={setBodyFont}>
                      <SelectTrigger id="body-font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {googleFonts.map((font) => (
                          <SelectItem
                            key={font.name}
                            value={font.family}
                            style={{ fontFamily: font.family }}
                          >
                            {font.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="manage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Save Changes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-stretch space-y-2 max-w-sm">
              <Button
                className="w-full"
                onClick={handleSaveTheme}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Apply &amp; Save Theme
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleReset}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset to Default
              </Button>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Changes will be applied globally and may require a page reload.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your branding changes will look in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg border p-6 transition-colors"
                style={{
                  ...previewStyle,
                  fontFamily: "var(--preview-font-body)",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-full"
                      style={{ backgroundColor: "var(--preview-primary)" }}
                    ></div>
                    <h3
                      className="font-bold text-lg"
                      style={{
                        color: "var(--preview-foreground)",
                        fontFamily: "var(--preview-font-headline)",
                      }}
                    >
                      School Portal
                    </h3>
                  </div>
                  <Avatar>
                    <AvatarImage src="https://picsum.photos/seed/admin-avatar/100" />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                </div>

                <Card style={{ backgroundColor: "var(--preview-card)" }}>
                  <CardHeader>
                    <CardTitle
                      style={{
                        color: "var(--preview-foreground)",
                        fontFamily: "var(--preview-font-headline)",
                      }}
                    >
                      Example Card
                    </CardTitle>
                    <CardDescription
                      style={{
                        color: "var(--preview-muted-foreground)",
                        fontFamily: "var(--preview-font-body)",
                      }}
                    >
                      This is a preview of a card component.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        style={{
                          backgroundColor: "var(--preview-primary)",
                          color: "white",
                          fontFamily: "var(--preview-font-body)",
                        }}
                      >
                        Primary Button
                      </Button>
                      <Button
                        variant="secondary"
                        style={{
                          backgroundColor: "var(--preview-accent)",
                          color: "white",
                          fontFamily: "var(--preview-font-body)",
                        }}
                      >
                        Accent Button
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        style={{
                          backgroundColor: "var(--preview-primary)",
                          color: "white",
                          fontFamily: "var(--preview-font-body)",
                        }}
                      >
                        Primary Badge
                      </Badge>
                      <Badge
                        style={{
                          backgroundColor: "var(--preview-accent)",
                          color: "white",
                          fontFamily: "var(--preview-font-body)",
                        }}
                      >
                        Accent Badge
                      </Badge>
                    </div>
                    <div
                      className="p-4 rounded-md"
                      style={{ backgroundColor: "var(--preview-muted)" }}
                    >
                      <p
                        className="text-sm"
                        style={{
                          color: "var(--preview-muted-foreground)",
                          fontFamily: "var(--preview-font-body)",
                        }}
                      >
                        This is a muted background area.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
