export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserType = 'customer' | 'contractor' | 'vendor' | 'admin'
export type ExperienceLevel = 'entry' | 'intermediate' | 'expert'
export type BudgetType = 'fixed' | 'hourly'
export type ProjectType = 'one-time' | 'ongoing' | 'contract-to-hire'
export type AvailabilityType = 'full-time' | 'part-time' | 'project-based' | 'weekends'
export type ProposalStatus = 'submitted' | 'interviewing' | 'accepted' | 'rejected'
export type ProjectStatus = 'in-progress' | 'review' | 'completed' | 'on-hold' | 'cancelled'
export type ContractStatus = 'active' | 'pending' | 'completed' | 'cancelled'
export type JobStatus = 'open' | 'in-progress' | 'closed' | 'cancelled'
export type NotificationType = 'new_proposal' | 'message' | 'milestone' | 'payment' | 'review' | 'contract' | 'enquiry' | 'system'
export type DocumentType = 'incorporation' | 'pan' | 'gst' | 'msme' | 'aoa' | 'moa' | 'director_details'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_type: UserType
          email: string
          full_name: string
          profile_picture_url: string | null
          profile_completed: boolean
          onboarding_step: number
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_type: UserType
          email: string
          full_name: string
          profile_picture_url?: string | null
          profile_completed?: boolean
          onboarding_step?: number
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_type?: UserType
          email?: string
          full_name?: string
          profile_picture_url?: string | null
          profile_completed?: boolean
          onboarding_step?: number
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          company_name: string
          company_website: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string
          timezone: string | null
          total_spent: number
          active_projects_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_name: string
          company_website?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string
          timezone?: string | null
          total_spent?: number
          active_projects_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          company_website?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string
          timezone?: string | null
          total_spent?: number
          active_projects_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      contractors: {
        Row: {
          id: string
          title: string
          bio: string | null
          location: string | null
          timezone: string | null
          hourly_rate: number | null
          experience_level: ExperienceLevel
          availability: AvailabilityType
          languages: string[]
          completed_projects: number
          rating: number
          review_count: number
          response_rate: number
          profile_views: number
          total_earnings: number
          available_earnings: number
          escrow_earnings: number
          is_available: boolean
          google_oauth_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          bio?: string | null
          location?: string | null
          timezone?: string | null
          hourly_rate?: number | null
          experience_level?: ExperienceLevel
          availability?: AvailabilityType
          languages?: string[]
          completed_projects?: number
          rating?: number
          review_count?: number
          response_rate?: number
          profile_views?: number
          total_earnings?: number
          available_earnings?: number
          escrow_earnings?: number
          is_available?: boolean
          google_oauth_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          bio?: string | null
          location?: string | null
          timezone?: string | null
          hourly_rate?: number | null
          experience_level?: ExperienceLevel
          availability?: AvailabilityType
          languages?: string[]
          completed_projects?: number
          rating?: number
          review_count?: number
          response_rate?: number
          profile_views?: number
          total_earnings?: number
          available_earnings?: number
          escrow_earnings?: number
          is_available?: boolean
          google_oauth_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          company_name: string
          tagline: string | null
          description: string | null
          website_url: string | null
          logo_url: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string
          contact_name: string
          contact_email: string
          contact_phone: string
          company_size: string | null
          year_founded: number | null
          employee_count: number
          projects_completed: number
          years_in_business: number
          hourly_rate: number | null
          monthly_rate: number | null
          rating: number
          review_count: number
          response_time: string
          total_revenue: number
          active_contracts_count: number
          is_verified: boolean
          bank_name: string | null
          account_number: string | null
          ifsc_code: string | null
          bank_address: string | null
          registered_email: string | null
          registered_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_name: string
          tagline?: string | null
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string
          contact_name: string
          contact_email: string
          contact_phone: string
          company_size?: string | null
          year_founded?: number | null
          employee_count?: number
          projects_completed?: number
          years_in_business?: number
          hourly_rate?: number | null
          monthly_rate?: number | null
          rating?: number
          review_count?: number
          response_time?: string
          total_revenue?: number
          active_contracts_count?: number
          is_verified?: boolean
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          bank_address?: string | null
          registered_email?: string | null
          registered_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          tagline?: string | null
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string
          company_size?: string | null
          year_founded?: number | null
          employee_count?: number
          projects_completed?: number
          years_in_business?: number
          hourly_rate?: number | null
          monthly_rate?: number | null
          rating?: number
          review_count?: number
          response_time?: string
          total_revenue?: number
          active_contracts_count?: number
          is_verified?: boolean
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          bank_address?: string | null
          registered_email?: string | null
          registered_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          created_at?: string
        }
      }
      industries: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      service_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }
      contractor_skills: {
        Row: {
          id: string
          contractor_id: string
          skill_id: string
          created_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          skill_id: string
          created_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          skill_id?: string
          created_at?: string
        }
      }
      portfolio_items: {
        Row: {
          id: string
          contractor_id: string
          title: string
          description: string | null
          image_url: string | null
          project_url: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          title: string
          description?: string | null
          image_url?: string | null
          project_url?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          project_url?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      certifications: {
        Row: {
          id: string
          contractor_id: string
          name: string
          issuing_organization: string | null
          issue_date: string | null
          expiry_date: string | null
          credential_id: string | null
          credential_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contractor_id: string
          name: string
          issuing_organization?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          credential_id?: string | null
          credential_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contractor_id?: string
          name?: string
          issuing_organization?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          credential_id?: string | null
          credential_url?: string | null
          created_at?: string
        }
      }
      vendor_industries: {
        Row: {
          id: string
          vendor_id: string
          industry_id: string
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          industry_id: string
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          industry_id?: string
          created_at?: string
        }
      }
      vendor_services: {
        Row: {
          id: string
          vendor_id: string
          service_category_id: string | null
          name: string
          description: string | null
          keywords: string[] | null
          pricing_model: string | null
          base_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          service_category_id?: string | null
          name: string
          description?: string | null
          keywords?: string[] | null
          pricing_model?: string | null
          base_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          service_category_id?: string | null
          name?: string
          description?: string | null
          keywords?: string[] | null
          pricing_model?: string | null
          base_price?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      vendor_documents: {
        Row: {
          id: string
          vendor_id: string
          document_type: DocumentType
          document_url: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          document_type: DocumentType
          document_url: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          document_type?: DocumentType
          document_url?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          uploaded_at?: string
        }
      }
      vendor_employees: {
        Row: {
          id: string
          vendor_id: string
          name: string
          role: string | null
          email: string | null
          phone: string | null
          skills: string[] | null
          hourly_rate: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          role?: string | null
          email?: string | null
          phone?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          role?: string | null
          email?: string | null
          phone?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vendor_packages: {
        Row: {
          id: string
          vendor_id: string
          name: string
          description: string | null
          price: number
          billing_period: string
          features: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          description?: string | null
          price: number
          billing_period?: string
          features?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          description?: string | null
          price?: number
          billing_period?: string
          features?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          customer_id: string
          title: string
          description: string
          category: string | null
          budget_type: BudgetType
          budget_amount: number
          currency: string
          timeline: string | null
          experience_level: ExperienceLevel
          project_type: ProjectType
          location: string | null
          status: JobStatus
          proposals_count: number
          views_count: number
          posted_at: string
          closed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          title: string
          description: string
          category?: string | null
          budget_type: BudgetType
          budget_amount: number
          currency?: string
          timeline?: string | null
          experience_level?: ExperienceLevel
          project_type: ProjectType
          location?: string | null
          status?: JobStatus
          proposals_count?: number
          views_count?: number
          posted_at?: string
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          title?: string
          description?: string
          category?: string | null
          budget_type?: BudgetType
          budget_amount?: number
          currency?: string
          timeline?: string | null
          experience_level?: ExperienceLevel
          project_type?: ProjectType
          location?: string | null
          status?: JobStatus
          proposals_count?: number
          views_count?: number
          posted_at?: string
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_skills: {
        Row: {
          id: string
          job_id: string
          skill_id: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          skill_id: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          skill_id?: string
          created_at?: string
        }
      }
      job_attachments: {
        Row: {
          id: string
          job_id: string
          file_name: string
          file_url: string
          file_size: number | null
          file_type: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          job_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          job_id: string
          contractor_id: string
          proposal_content: string
          cover_letter: string | null
          proposed_budget: number
          proposed_timeline: string
          proposal_score: number | null
          status: ProposalStatus
          ai_generated: boolean
          submitted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          contractor_id: string
          proposal_content: string
          cover_letter?: string | null
          proposed_budget: number
          proposed_timeline: string
          proposal_score?: number | null
          status?: ProposalStatus
          ai_generated?: boolean
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          contractor_id?: string
          proposal_content?: string
          cover_letter?: string | null
          proposed_budget?: number
          proposed_timeline?: string
          proposal_score?: number | null
          status?: ProposalStatus
          ai_generated?: boolean
          submitted_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          customer_id: string
          contractor_id: string | null
          vendor_id: string | null
          job_id: string | null
          title: string
          description: string | null
          budget: number
          progress: number
          status: ProjectStatus
          start_date: string
          deadline: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          contractor_id?: string | null
          vendor_id?: string | null
          job_id?: string | null
          title: string
          description?: string | null
          budget: number
          progress?: number
          status?: ProjectStatus
          start_date: string
          deadline?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          contractor_id?: string | null
          vendor_id?: string | null
          job_id?: string | null
          title?: string
          description?: string | null
          budget?: number
          progress?: number
          status?: ProjectStatus
          start_date?: string
          deadline?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_milestones: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          amount: number | null
          due_date: string | null
          completed: boolean
          completed_at: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          amount?: number | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          amount?: number | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          contract_number: string
          project_id: string | null
          customer_id: string
          vendor_id: string | null
          contractor_id: string | null
          title: string
          start_date: string
          end_date: string | null
          total_value: number
          payment_terms: string | null
          status: ContractStatus
          terms_and_conditions: string | null
          signed_by_customer: boolean
          signed_by_vendor: boolean
          customer_signature_date: string | null
          vendor_signature_date: string | null
          document_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_number: string
          project_id?: string | null
          customer_id: string
          vendor_id?: string | null
          contractor_id?: string | null
          title: string
          start_date: string
          end_date?: string | null
          total_value: number
          payment_terms?: string | null
          status?: ContractStatus
          terms_and_conditions?: string | null
          signed_by_customer?: boolean
          signed_by_vendor?: boolean
          customer_signature_date?: string | null
          vendor_signature_date?: string | null
          document_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_number?: string
          project_id?: string | null
          customer_id?: string
          vendor_id?: string | null
          contractor_id?: string | null
          title?: string
          start_date?: string
          end_date?: string | null
          total_value?: number
          payment_terms?: string | null
          status?: ContractStatus
          terms_and_conditions?: string | null
          signed_by_customer?: boolean
          signed_by_vendor?: boolean
          customer_signature_date?: string | null
          vendor_signature_date?: string | null
          document_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contract_services: {
        Row: {
          id: string
          contract_id: string
          service_name: string
          description: string | null
          price: number
          quantity: number
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          service_name: string
          description?: string | null
          price: number
          quantity?: number
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          service_name?: string
          description?: string | null
          price?: number
          quantity?: number
          display_order?: number
          created_at?: string
        }
      }
      contract_deliverables: {
        Row: {
          id: string
          contract_id: string
          title: string
          description: string | null
          due_date: string | null
          completed: boolean
          completed_at: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          title: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          display_order?: number
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          subject: string | null
          content: string
          is_read: boolean
          read_at: string | null
          parent_message_id: string | null
          project_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          subject?: string | null
          content: string
          is_read?: boolean
          read_at?: string | null
          parent_message_id?: string | null
          project_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          subject?: string | null
          content?: string
          is_read?: boolean
          read_at?: string | null
          parent_message_id?: string | null
          project_id?: string | null
          created_at?: string
        }
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_url: string
          file_size: number | null
          file_type: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          link_url: string | null
          is_read: boolean
          read_at: string | null
          related_job_id: string | null
          related_project_id: string | null
          related_proposal_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          link_url?: string | null
          is_read?: boolean
          read_at?: string | null
          related_job_id?: string | null
          related_project_id?: string | null
          related_proposal_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          message?: string
          link_url?: string | null
          is_read?: boolean
          read_at?: string | null
          related_job_id?: string | null
          related_project_id?: string | null
          related_proposal_id?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          customer_id: string
          contractor_id: string | null
          vendor_id: string | null
          project_id: string | null
          rating: number
          comment: string | null
          would_recommend: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          contractor_id?: string | null
          vendor_id?: string | null
          project_id?: string | null
          rating: number
          comment?: string | null
          would_recommend?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          contractor_id?: string | null
          vendor_id?: string | null
          project_id?: string | null
          rating?: number
          comment?: string | null
          would_recommend?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      saved_vendors: {
        Row: {
          id: string
          customer_id: string
          vendor_id: string | null
          contractor_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          vendor_id?: string | null
          contractor_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          vendor_id?: string | null
          contractor_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      enquiries: {
        Row: {
          id: string
          customer_id: string
          vendor_id: string
          subject: string
          message: string
          customer_email: string
          customer_phone: string | null
          status: string
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          vendor_id: string
          subject: string
          message: string
          customer_email: string
          customer_phone?: string | null
          status?: string
          responded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          vendor_id?: string
          subject?: string
          message?: string
          customer_email?: string
          customer_phone?: string | null
          status?: string
          responded_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: UserType
      experience_level: ExperienceLevel
      budget_type: BudgetType
      project_type: ProjectType
      availability_type: AvailabilityType
      proposal_status: ProposalStatus
      project_status: ProjectStatus
      contract_status: ContractStatus
      job_status: JobStatus
      notification_type: NotificationType
      document_type: DocumentType
    }
  }
}
