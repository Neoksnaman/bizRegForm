
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import {
  CalendarIcon,
  PlusCircle,
  Trash2,
  Building2,
  User,
  Mail,
  Phone,
  Landmark,
  FileText,
  ChevronDown,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumericInput } from "./numeric-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { bizRegFormSchema, type BizRegFormValues, type GeneratePrimaryPurposeInput } from "@/lib/schemas";
import { AddressFields } from "./address-fields";
import { DatePicker } from "./date-picker";
import { submitBizReg } from "@/ai/flows/submit-biz-reg";
import { generatePrimaryPurpose } from "@/ai/flows/generate-primary-purpose";
import { useState, useEffect } from "react";
import { TinInput } from "./tin-input";
import { FeeCalculator } from "./fee-calculator";


const defaultIncorporator = {
  name: "",
  tin: "",
  nationality: "Filipino",
  residence: {
    street: "",
    barangay: "",
    city: "",
    province: "",
    zipCode: "",
  },
  sharesSubscribed: 0,
  amountSubscribed: 0,
  birthdate: undefined,
  esecureId: "",
};

export function BizRegForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPurpose, setIsGeneratingPurpose] = useState(false);
  const form = useForm<BizRegFormValues>({
    resolver: zodResolver(bizRegFormSchema),
    mode: 'onChange', // Validate on change to clear errors faster
    defaultValues: {
      corporationNames: { name1: "", name2: "", name3: "" },
      principalOfficeAddress: {
        street: "", barangay: "", city: "", province: "", zipCode: "",
      },
      industryDescription: "",
      primaryPurpose: "",
      secondaryPurpose: "",
      companyEmail: "",
      companyPhone: "",
      alternateEmail: "",
      alternatePhone: "",
      incorporators: [defaultIncorporator],
      corporateTreasurer: "",
      treasurerEsecureId: "",
      annualMeetingDate: undefined,
      sharesDetails: {
        authorizedCapital: 100000,
        subscribedCapital: 25000,
        paidUpCapital: 6250,
        parValue: 10,
      },
      leaseRent: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "incorporators",
  });

  const watchedIncorporators = form.watch("incorporators");
  
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Auto-calculate amount subscribed
      if ( name?.startsWith('incorporators') || name === 'sharesDetails.parValue') {
        const parValue = value.sharesDetails?.parValue || 0;
        value.incorporators?.forEach((incorporator, index) => {
          const sharesSubscribed = incorporator?.sharesSubscribed || 0;
          const calculatedAmount = sharesSubscribed * parValue;
          
          const currentAmount = form.getValues(`incorporators.${index}.amountSubscribed`);
          
          if (currentAmount !== calculatedAmount) {
            form.setValue(
              `incorporators.${index}.amountSubscribed`,
              calculatedAmount,
              { shouldValidate: true }
            );
          }
        });
      }
      
      // Auto-validate subscribed capital when incorporators' shares change
      if (name?.startsWith('incorporators') && name.endsWith('sharesSubscribed')) {
        const totalShares = value.incorporators?.reduce((acc, inc) => acc + (inc?.sharesSubscribed || 0), 0);
        const subscribedCapital = form.getValues('sharesDetails.subscribedCapital');
        if(totalShares === subscribedCapital) {
           form.trigger("sharesDetails.subscribedCapital");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  // Effect for auto-filling Treasurer E-Secure ID
  useEffect(() => {
    const treasurerName = form.watch("corporateTreasurer");
    const incorporators = form.watch("incorporators");
    const selectedTreasurer = incorporators.find(
      (inc) => inc.name === treasurerName
    );

    const currentTreasurerId = form.getValues("treasurerEsecureId");
    const newTreasurerId = selectedTreasurer?.esecureId || "";

    if (currentTreasurerId !== newTreasurerId) {
      form.setValue("treasurerEsecureId", newTreasurerId, {
        shouldValidate: true,
      });
    }
    // This effect should run whenever the treasurer selection or any incorporator details change
  }, [form.watch("corporateTreasurer"), watchedIncorporators, form]);


  async function handleGeneratePurpose() {
    const industryDescription = form.getValues("industryDescription");
    if (!industryDescription) {
      toast({
        title: "Industry Description is empty",
        description: "Please describe your industry before generating the primary purpose.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPurpose(true);
    try {
      const result = await generatePrimaryPurpose({ industryDescription });
      if (result.primaryPurpose) {
        form.setValue("primaryPurpose", result.primaryPurpose, { shouldValidate: true });
        toast({
          title: "Primary Purpose Generated!",
          description: "The Primary Purpose has been filled in for you.",
        });
      }
    } catch (error) {
      console.error("Failed to generate primary purpose:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating the primary purpose.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPurpose(false);
    }
  }

  async function onSubmit(data: BizRegFormValues) {
    setIsSubmitting(true);
    
    // Create a deep copy to avoid mutating the original form state
    const dataToSend = JSON.parse(JSON.stringify(data));

    // Convert Date objects to ISO strings before sending
    if (data.annualMeetingDate) {
      dataToSend.annualMeetingDate = new Date(data.annualMeetingDate).toISOString();
    }
    dataToSend.incorporators.forEach((inc: any) => {
      if (inc.birthdate) {
        inc.birthdate = new Date(inc.birthdate).toISOString();
      }
    });

    const result = await submitBizReg(dataToSend as BizRegFormValues);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Form Submitted Successfully!",
        description: "Your business registration data has been submitted.",
        variant: "default",
      });
      form.reset();
    } else {
      toast({
        title: "Submission Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  }

  const incorporatorNames = watchedIncorporators.map(inc => inc.name).filter(Boolean);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Company Information
            </CardTitle>
            <CardDescription>
              Provide the essential details about your proposed corporation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="corporationNames.name1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Corporation Names</FormLabel>
                  <FormControl>
                    <Input placeholder="1st Choice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="corporationNames.name2"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="2nd Choice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="corporationNames.name3"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="3rd Choice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator/>

            <div>
              <FormLabel>Principal Office Address</FormLabel>
              <div className="mt-2">
                <AddressFields form={form} baseFieldName="principalOfficeAddress" />
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="companyEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Official E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="official@company.com" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Official Contact Number</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="e.g., 09171234567 or 81234567" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="alternateEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate E-mail</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="alternate@company.com" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alternatePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Contact</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="e.g., 09171234567 or 81234567" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Purpose & Industry
            </CardTitle>
            <CardDescription>
              Describe the nature and objectives of your business.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <FormField
              control={form.control}
              name="industryDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Software development and IT consulting services"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryPurpose"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Primary Purpose</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGeneratePurpose}
                      disabled={isGeneratingPurpose}
                    >
                      {isGeneratingPurpose ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate with AI
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the main business activity..."
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                   <FormDescription>
                    <a href="https://drive.google.com/file/d/1UncqHvfS0jxgplkBlXe3KISswy9cConj/view" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                      Refer to the PSIC list for guidance <ExternalLink className="w-3 h-3" />
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="secondaryPurpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Purpose (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe other business activities..."
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <span className="font-bold text-primary text-2xl">₱</span>
              Share Details
            </CardTitle>
            <CardDescription>
              Specify the capital structure of your corporation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="sharesDetails.authorizedCapital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authorized Capital Stock</FormLabel>
                    <FormControl>
                      <NumericInput
                        placeholder="0.00"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sharesDetails.parValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Par Value per Share</FormLabel>
                    <FormControl>
                      <NumericInput
                        placeholder="0.00"
                        value={field.value}
                        onChange={field.onChange}
                        prefix="₱"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sharesDetails.subscribedCapital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscribed Capital Stock</FormLabel>
                    <FormControl>
                      <NumericInput
                        placeholder="0.00"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sharesDetails.paidUpCapital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid-up Capital Stock</FormLabel>
                    <FormControl>
                      <NumericInput
                        placeholder="0.00"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Incorporators
              </CardTitle>
              <CardDescription>
                Provide details for each incorporator (1 to 5 people).
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="space-y-6 -mt-4">
            {fields.map((item, index) => (
              <Card key={item.id} className="bg-card/50 border-dashed">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-headline text-xl">
                    Incorporator #{index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    aria-label="Remove incorporator"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name={`incorporators.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name (Last, First, Middle)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Dela Cruz, Juan, Santos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`incorporators.${index}.tin`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Identification Number (TIN)</FormLabel>
                          <FormControl>
                            <TinInput
                              placeholder="000-000-000"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`incorporators.${index}.nationality`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationality</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Filipino" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`incorporators.${index}.birthdate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birthdate</FormLabel>
                           <FormControl>
                              <DatePicker 
                                date={field.value} 
                                setDate={field.onChange}
                                placeholder="Select birthdate"
                                showYearPicker
                              />
                           </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`incorporators.${index}.esecureId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Esecure ID No.</FormLabel>
                          <FormControl>
                            <Input placeholder="ID Number" {...field} />
                          </FormControl>
                           <FormDescription>
                              <a href="https://esecure.sec.gov.ph/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                                Don't have an eSecure ID? Get one here <ExternalLink className="w-3 h-3" />
                              </a>
                            </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel>Residence Address</FormLabel>
                    <div className="mt-2">
                      <AddressFields form={form} baseFieldName={`incorporators.${index}.residence`} />
                    </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`incorporators.${index}.sharesSubscribed`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. of Shares Subscribed</FormLabel>
                          <FormControl>
                            <NumericInput
                              placeholder="0"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`incorporators.${index}.amountSubscribed`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Subscribed</FormLabel>
                          <FormControl>
                             <NumericInput
                                placeholder="0.00"
                                value={field.value}
                                onChange={field.onChange}
                                prefix="₱"
                                disabled
                              />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-accent/10 border-accent/50 text-accent-foreground hover:bg-accent/20"
              onClick={() => append(defaultIncorporator)}
              disabled={fields.length >= 5}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Incorporator
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" />
              Corporate Governance
            </CardTitle>
            <CardDescription>
              Specify key governance positions and meeting schedules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="corporateTreasurer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corporate Treasurer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={incorporatorNames.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a treasurer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {incorporatorNames.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="treasurerEsecureId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treasurer Esecure ID No.</FormLabel>
                    <FormControl>
                      <Input placeholder="ID Number" {...field} disabled />
                    </FormControl>
                     <FormDescription>
                      <a href="https://esecure.sec.gov.ph/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                        Don't have an eSecure ID? Get one here <ExternalLink className="w-3 h-3" />
                      </a>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="annualMeetingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Annual Meeting</FormLabel>
                  <FormControl>
                    <DatePicker 
                      date={field.value} 
                      setDate={field.onChange}
                      placeholder="Select a date"
                      showYearPicker
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <FeeCalculator form={form} />
        
        <div className="flex justify-end">
          <Button type="submit" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Registration Data
          </Button>
        </div>
      </form>
    </Form>
  );
}
