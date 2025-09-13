
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Upload, Eye, Save, Moon, Sun, Image as ImageIcon, RefreshCw, Type } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Form, FormDescription } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ColorPicker = ({ label, color, setColor }: { label: string, color: string, setColor: (color: string) => void }) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: color }} />
            <Input value={color} onChange={e => setColor(e.target.value)} className="w-full" />
        </div>
    </div>
);

const googleFonts = [
    { name: 'Inter', family: 'Inter, sans-serif' },
    { name: 'Playfair Display', family: "'Playfair Display', serif" },
    { name: 'Roboto', family: 'Roboto, sans-serif' },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'PT Sans', family: "'PT Sans', sans-serif" },
];


export default function BrandingPage() {
    const [primaryColor, setPrimaryColor] = React.useState('#008080');
    const [accentColor, setAccentColor] = React.useState('#B8860B');
    const [backgroundColor, setBackgroundColor] = React.useState('#F5F5DC');
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const [headlineFont, setHeadlineFont] = React.useState(googleFonts[1].family);
    const [bodyFont, setBodyFont] = React.useState(googleFonts[4].family);

    const form = useForm();

    const previewStyle = {
        '--preview-primary': primaryColor,
        '--preview-accent': accentColor,
        '--preview-background': isDarkMode ? '#1e293b' : backgroundColor,
        '--preview-foreground': isDarkMode ? '#f8fafc' : '#0f172a',
        '--preview-card': isDarkMode ? '#293548' : '#ffffff',
        '--preview-muted': isDarkMode ? '#334155' : '#f1f5f9',
        '--preview-muted-foreground': isDarkMode ? '#94a3b8' : '#64748b',
        '--preview-font-headline': headlineFont,
        '--preview-font-body': bodyFont,
    } as React.CSSProperties;


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8 text-primary"/>
            Branding & Customization
        </h1>
        <p className="text-muted-foreground">Tailor the school portal to match your brand identity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>School Logo & Media</CardTitle>
                    <CardDescription>Upload your school's logo, cover image, and favicon.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form className="space-y-6">
                    <div className="space-y-2">
                        <Label>School Logo</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src="https://picsum.photos/seed/school-logo/200" />
                                <AvatarFallback>SL</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" className="w-full" disabled>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload New Logo
                            </Button>
                        </div>
                        <FormDescription>Recommended format: PNG or SVG.</FormDescription>
                    </div>
                     <div className="space-y-2">
                        <Label>Login Page Cover Image</Label>
                        <div className="flex items-center justify-center w-full">
                            <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">Upload Cover Image</p>
                                    <p className="text-xs text-muted-foreground">(1920x1080 recommended)</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" disabled />
                            </Label>
                        </div>
                         <FormDescription>This image is shown on the dashboard login page.</FormDescription>
                    </div>
                     <div className="space-y-2">
                        <Label>School Favicon</Label>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-md">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="https://picsum.photos/seed/school-logo/200" />
                                    <AvatarFallback>SL</AvatarFallback>
                                </Avatar>
                            </div>
                            <Button variant="outline" className="w-full" disabled>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Favicon
                            </Button>
                        </div>
                        <FormDescription>An icon for the browser tab. Recommended format: .ico or .png (32x32px).</FormDescription>
                    </div>
                    </form>
                    </Form>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Color Scheme</CardTitle>
                    <CardDescription>Customize the look and feel of the portal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ColorPicker label="Primary Color" color={primaryColor} setColor={setPrimaryColor} />
                    <ColorPicker label="Accent Color" color={accentColor} setColor={setAccentColor} />
                    <ColorPicker label="Background Color (Light Mode)" color={backgroundColor} setColor={setBackgroundColor} />
                     <Separator />
                    <div className="flex items-center justify-between">
                        <Label htmlFor="dark-mode" className="flex items-center gap-2">
                            {isDarkMode ? <Moon/> : <Sun />}
                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </Label>
                        <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-primary"/>Typography</CardTitle>
                    <CardDescription>Select fonts for headings and body text.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="headline-font">Headline Font</Label>
                        <Select value={headlineFont} onValueChange={setHeadlineFont}>
                            <SelectTrigger id="headline-font"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {googleFonts.map(font => (
                                    <SelectItem key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                                        {font.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="body-font">Body Font</Label>
                        <Select value={bodyFont} onValueChange={setBodyFont}>
                            <SelectTrigger id="body-font"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {googleFonts.map(font => (
                                    <SelectItem key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                                        {font.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Save Changes</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-stretch space-y-2">
                    <Button className="w-full" disabled>
                        <Save className="mr-2 h-4 w-4" />
                        Apply & Save Theme
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset to Default
                    </Button>
                </CardContent>
             </Card>
        </div>
        <div className="lg:col-span-2">
             <Card className="sticky top-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary"/>Live Preview</CardTitle>
                    <CardDescription>See how your branding changes will look in real-time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        className="rounded-lg border p-6 transition-colors"
                        style={{ ...previewStyle, fontFamily: 'var(--preview-font-body)' }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full" style={{ backgroundColor: 'var(--preview-primary)' }}></div>
                                <h3 className="font-bold text-lg" style={{ color: 'var(--preview-foreground)', fontFamily: 'var(--preview-font-headline)' }}>School Portal</h3>
                            </div>
                            <Avatar>
                                <AvatarImage src="https://picsum.photos/seed/admin-avatar/100" />
                                <AvatarFallback>A</AvatarFallback>
                            </Avatar>
                        </div>

                        <Card style={{ backgroundColor: 'var(--preview-card)' }}>
                            <CardHeader>
                                <CardTitle style={{ color: 'var(--preview-foreground)', fontFamily: 'var(--preview-font-headline)' }}>Example Card</CardTitle>
                                <CardDescription style={{ color: 'var(--preview-muted-foreground)', fontFamily: 'var(--preview-font-body)' }}>This is a preview of a card component.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Button style={{ backgroundColor: 'var(--preview-primary)', color: 'white', fontFamily: 'var(--preview-font-body)' }}>Primary Button</Button>
                                    <Button variant="secondary" style={{ backgroundColor: 'var(--preview-accent)', color: 'white', fontFamily: 'var(--preview-font-body)' }}>Accent Button</Button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge style={{ backgroundColor: 'var(--preview-primary)', color: 'white', fontFamily: 'var(--preview-font-body)' }}>Primary Badge</Badge>
                                    <Badge style={{ backgroundColor: 'var(--preview-accent)', color: 'white', fontFamily: 'var(--preview-font-body)' }}>Accent Badge</Badge>
                                </div>
                                <div className="p-4 rounded-md" style={{ backgroundColor: 'var(--preview-muted)' }}>
                                    <p className="text-sm" style={{ color: 'var(--preview-muted-foreground)', fontFamily: 'var(--preview-font-body)' }}>This is a muted background area.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
