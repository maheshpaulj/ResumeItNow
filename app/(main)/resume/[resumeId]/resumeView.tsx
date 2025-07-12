"use client";
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Edit, Loader2, Save, X, MoveUp, MoveDown, Eye, EyeOff } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ResumeData } from './types';
import { useSession } from 'next-auth/react';
import { ModernTemplate } from '@/components/resume/templates/Modern';
import { OldModernTemplate } from '@/components/resume/templates/Modern-old';
import { MinimalTemplate } from '@/components/resume/templates/Minimal';
import { ProfessionalTemplate } from '@/components/resume/templates/Professional';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable, DraggableProvided, DroppableProvided } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import debounce from 'lodash/debounce';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Template components mapping
const TEMPLATES = {
  modern: ModernTemplate,
  modern_old: OldModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
} as const;

type TemplateKey = keyof typeof TEMPLATES;

const DEFAULT_SECTION_ORDER = [
  'objective',
  'workExperience',
  'projects',
  'education',
  'skills',
  'certifications',
  'languages',
  'customSections',
];

const FONT_OPTIONS = [
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Calibri', label: 'Calibri' },
];

export default function ResumeView({
  resumeData: initialResumeData,
  resumeId,
}: {
  resumeData: ResumeData & {
    accentColor?: string;
    fontFamily?: string;
    sectionOrder?: string[];
    showIcons?: boolean;
  };
  resumeId: string;
}) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [resumeData, setResumeData] = useState(initialResumeData);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('modern');
  const [accentColor, setAccentColor] = useState(initialResumeData.accentColor || '#000000');
  const [fontFamily, setFontFamily] = useState(initialResumeData.fontFamily || 'DM Sans');
  const [sectionOrder, setSectionOrder] = useState<string[]>(
    initialResumeData.sectionOrder || DEFAULT_SECTION_ORDER
  );
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [tempSectionOrder, setTempSectionOrder] = useState<string[]>(sectionOrder);
  const [showIcons, setShowIcons] = useState(initialResumeData.showIcons ?? true);
  const { data: session } = useSession();

  useEffect(() => {
    const savedTemplate = localStorage.getItem('resumeitnow_template');
    if (savedTemplate && savedTemplate in TEMPLATES) {
      setSelectedTemplate(savedTemplate as TemplateKey);
    }
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const queryParams = new URLSearchParams({
        data: JSON.stringify(resumeData),
        template: selectedTemplate,
        accentColor: accentColor,
        fontFamily: fontFamily,
        sectionOrder: JSON.stringify(sectionOrder),
        showIcons: showIcons.toString(),
      }).toString();

      const response = await fetch(`/api/pdf?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personalDetails.fullName}'s Resume - Made Using ResumeItNow.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'PDF downloaded successfully!',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed',
        description: 'Failed to download PDF!',
        duration: 3000,
      });
      console.error('Error downloading PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  function flattenObject(obj: any, parentKey = ''): { [key: string]: any } { // eslint-disable-line @typescript-eslint/no-explicit-any
    return Object.keys(obj).reduce((acc, key) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (Array.isArray(obj[key])) {
        return { ...acc, [newKey]: obj[key] };
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        return { ...acc, ...flattenObject(obj[key], newKey) };
      } else {
        return { ...acc, [newKey]: obj[key] };
      }
    }, {});
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const userEmail = session?.user?.email;
      if (!userEmail) throw new Error('User email not found');
      const resumeRef = doc(db, `users/${userEmail}/resumes/${resumeId}`);
      const flattenedData = flattenObject({
        ...resumeData,
        template: selectedTemplate,
        accentColor,
        fontFamily,
        sectionOrder,
        showIcons,
      });
      await updateDoc(resumeRef, flattenedData);
      localStorage.setItem('resumeitnow_template', selectedTemplate);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Resume saved successfully!',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <T extends keyof ResumeData>(
    section: T,
    index: number | null,
    field: string,
    value: string
  ) => {
    setResumeData((prev) => {
      if (index === null) {
        if (section === 'personalDetails') {
          return {
            ...prev,
            personalDetails: { ...prev.personalDetails, [field]: value },
          };
        }
        if (section === 'objective') {
          return { ...prev, objective: value };
        }
        if (section === 'jobTitle') {
          return { ...prev, jobTitle: value };
        }
        return prev;
      }
      const sectionArray = [...(prev[section] as any[])]; // eslint-disable-line @typescript-eslint/no-explicit-any
      sectionArray[index] = { ...sectionArray[index], [field]: value };
      return { ...prev, [section]: sectionArray };
    });
  };

  const onDragEnd = (result: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!result.destination) return;
    const newOrder = Array.from(tempSectionOrder);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);
    setTempSectionOrder(newOrder);
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...tempSectionOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setTempSectionOrder(newOrder);
  };

  const moveSectionDown = (index: number) => {
    if (index === tempSectionOrder.length - 1) return;
    const newOrder = [...tempSectionOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setTempSectionOrder(newOrder);
  };

  const saveSectionOrder = () => {
    setSectionOrder(tempSectionOrder);
    setIsReorderModalOpen(false);
  };

  const debouncedSetAccentColor = useCallback( // eslint-disable-line react-hooks/exhaustive-deps
    debounce((color: string) => setAccentColor(color), 100),
    []
  );

  const handleAccentColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    debouncedSetAccentColor(newColor);
  };

  const TemplateComponent = TEMPLATES[selectedTemplate];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-4 px-4 sm:px-6 flex flex-col items-center">
      {/* Controls Card - Hidden on Print */}
      <Card className="w-full max-w-[21cm] mb-4 print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-col">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between">
              <div className="flex space-x-2">
                <Select
                  value={selectedTemplate}
                  onValueChange={(value: TemplateKey) => setSelectedTemplate(value)}
                  disabled={isEditing}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern Template</SelectItem>
                    <SelectItem value="modern_old">Modern(old) Template</SelectItem>
                    <SelectItem value="minimal">Minimal Template</SelectItem>
                    <SelectItem value="professional">Professional Template</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-2 w-2 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="default"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResumeData(initialResumeData);
                        setAccentColor(initialResumeData.accentColor || '#000000');
                        setFontFamily(initialResumeData.fontFamily || 'DM Sans');
                        setSectionOrder(initialResumeData.sectionOrder || DEFAULT_SECTION_ORDER);
                        setIsEditing(false);
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Resume
                  </Button>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex max-md:flex-col items-center justify-between w-full gap-4 border-t border-border mt-4 pt-4">
                <div className="flex flex-col">
                  <label className="text-sm">Accent Color:</label>
                  <Input
                    type="color"
                    value={accentColor}
                    onChange={handleAccentColorChange}
                    className="w-full sm:w-20"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm">Font Family:</label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select Font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="icon-toggle" 
                    checked={showIcons}
                    onCheckedChange={setShowIcons}
                  />
                  <Label htmlFor="icon-toggle" className="flex items-center gap-2">
                    {showIcons ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Show Icons
                  </Label>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setIsReorderModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  Rearrange Sections
                </Button>
              </div>              
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resume Wrapper - Hidden on Print Except for #resume-content */}
      <div className="w-full max-w-[21cm] min-h-[29.7cm] bg-white shadow-lg">
        <div id="resume-content" className="w-full">
          <TemplateComponent
            resumeData={resumeData}
            isEditing={isEditing}
            updateField={updateField}
            accentColor={accentColor}
            fontFamily={fontFamily}
            sectionOrder={sectionOrder}
            showIcons={showIcons}
          />
        </div>
      </div>

      {/* Reorder Modal - Hidden on Print */}
      <Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
        <DialogContent className="print:hidden">
          <DialogHeader>
            <DialogTitle>Rearrange Sections</DialogTitle>
          </DialogHeader>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections">
              {(provided: DroppableProvided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {tempSectionOrder.map((section, index) => (
                    <Draggable key={section} draggableId={section} index={index}>
                      {(provided: DraggableProvided, snapshot) => (
                        <motion.div
                          {...provided.draggableProps}
                          ref={provided.innerRef}
                          className={`flex items-center justify-between p-2 border border-border border-gray-300 rounded shadow ${
                            snapshot.isDragging ? 'shadow-lg border-gray-400' : ''
                          }`}
                          layout
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="flex items-center space-x-2 cursor-default"
                          >
                            <span>{section.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveSectionUp(index)}
                              disabled={index === 0}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveSectionDown(index)}
                              disabled={index === tempSectionOrder.length - 1}
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTempSectionOrder(sectionOrder);
                setIsReorderModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveSectionOrder}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
          }
          // /* Hide everything except #resume-content */
          nav,
          footer {
            display: none !important;
          }
          #resume-content {
            display: block !important;
            width: 21cm !important;
            height: 29.7cm !important;
            margin: 0 !important;
            padding: 0.5cm !important;
            background: white !important;
            box-shadow: none !important;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          a {
            text-decoration: none !important;
          }
          input,
          textarea {
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .text-blue-600 {
            color: #2563eb !important;
          }
        }
        @media (max-width: 640px) {
          .max-w-[21cm] {
            max-width: 100%;
          }
          .min-h-[29.7cm] {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
}