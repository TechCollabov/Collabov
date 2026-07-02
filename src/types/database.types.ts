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
      case_studies: {
        Row: {
          id: string
          vendor_id: string
          project_title: string
          industry: string | null
          services_delivered: Json | null
          tech_stack: Json | null
          duration: string | null
          team_size: number | null
          challenge: string | null
          solution: string | null
          outcomes: Json | null
          client_quote: string | null
          ai_keyword_tags: Json | null
          ai_generated_hash: string | null
          user_edited: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          project_title: string
          industry?: string | null
          services_delivered?: Json | null
          tech_stack?: Json | null
          duration?: string | null
          team_size?: number | null
          challenge?: string | null
          solution?: string | null
          outcomes?: Json | null
          client_quote?: string | null
          ai_keyword_tags?: Json | null
          ai_generated_hash?: string | null
          user_edited?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          project_title?: string
          industry?: string | null
          services_delivered?: Json | null
          tech_stack?: Json | null
          duration?: string | null
          team_size?: number | null
          challenge?: string | null
          solution?: string | null
          outcomes?: Json | null
          client_quote?: string | null
          ai_keyword_tags?: Json | null
          ai_generated_hash?: string | null
          user_edited?: boolean | null
          created_at?: string | null
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
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
        }
      }
      change_requests: {
        Row: {
          id: string
          engagement_id: string | null
          contract_id: string | null
          requested_by: string
          requested_by_role: string
          request_type: string
          description: string
          payload: Json | null
          status: string
          respond_by: string
          response_note: string | null
          buyer_signed_at: string | null
          vendor_signed_at: string | null
          resolved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          engagement_id?: string | null
          contract_id?: string | null
          requested_by: string
          requested_by_role: string
          request_type: string
          description: string
          payload?: Json | null
          status?: string
          respond_by: string
          response_note?: string | null
          buyer_signed_at?: string | null
          vendor_signed_at?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          engagement_id?: string | null
          contract_id?: string | null
          requested_by?: string
          requested_by_role?: string
          request_type?: string
          description?: string
          payload?: Json | null
          status?: string
          respond_by?: string
          response_note?: string | null
          buyer_signed_at?: string | null
          vendor_signed_at?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
      }
      check_ins: {
        Row: {
          id: string
          engagement_id: string
          buyer_id: string
          vendor_id: string
          employee_id: string | null
          check_in_type: string
          period_label: string
          charge_date: string | null
          charge_amount: number | null
          opens_at: string | null
          scores: Json | null
          overall_score: number | null
          below_threshold: boolean | null
          status: string
          flag_note: string | null
          confirmed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          engagement_id: string
          buyer_id: string
          vendor_id: string
          employee_id?: string | null
          check_in_type: string
          period_label: string
          charge_date?: string | null
          charge_amount?: number | null
          opens_at?: string | null
          scores?: Json | null
          overall_score?: number | null
          below_threshold?: boolean | null
          status?: string
          flag_note?: string | null
          confirmed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          engagement_id?: string
          buyer_id?: string
          vendor_id?: string
          employee_id?: string | null
          check_in_type?: string
          period_label?: string
          charge_date?: string | null
          charge_amount?: number | null
          opens_at?: string | null
          scores?: Json | null
          overall_score?: number | null
          below_threshold?: boolean | null
          status?: string
          flag_note?: string | null
          confirmed_at?: string | null
          created_at?: string | null
        }
      }
      contract_deliverables: {
        Row: {
          id: string
          contract_id: string
          title: string
          description: string | null
          due_date: string | null
          completed: boolean | null
          completed_at: string | null
          display_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          title: string
          description?: string | null
          due_date?: string | null
          completed?: boolean | null
          completed_at?: string | null
          display_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean | null
          completed_at?: string | null
          display_order?: number | null
          created_at?: string | null
        }
      }
      contract_services: {
        Row: {
          id: string
          contract_id: string
          service_name: string
          description: string | null
          price: number
          quantity: number | null
          display_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          service_name: string
          description?: string | null
          price: number
          quantity?: number | null
          display_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          service_name?: string
          description?: string | null
          price?: number
          quantity?: number | null
          display_order?: number | null
          created_at?: string | null
        }
      }
      contractor_skills: {
        Row: {
          id: string
          contractor_id: string
          skill_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          contractor_id: string
          skill_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          contractor_id?: string
          skill_id?: string
          created_at?: string | null
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
          experience_level: ExperienceLevel | null
          availability: AvailabilityType | null
          languages: string[] | null
          completed_projects: number | null
          rating: number | null
          review_count: number | null
          response_rate: number | null
          profile_views: number | null
          total_earnings: number | null
          available_earnings: number | null
          escrow_earnings: number | null
          is_available: boolean | null
          google_oauth_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          title: string
          bio?: string | null
          location?: string | null
          timezone?: string | null
          hourly_rate?: number | null
          experience_level?: ExperienceLevel | null
          availability?: AvailabilityType | null
          languages?: string[] | null
          completed_projects?: number | null
          rating?: number | null
          review_count?: number | null
          response_rate?: number | null
          profile_views?: number | null
          total_earnings?: number | null
          available_earnings?: number | null
          escrow_earnings?: number | null
          is_available?: boolean | null
          google_oauth_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          bio?: string | null
          location?: string | null
          timezone?: string | null
          hourly_rate?: number | null
          experience_level?: ExperienceLevel | null
          availability?: AvailabilityType | null
          languages?: string[] | null
          completed_projects?: number | null
          rating?: number | null
          review_count?: number | null
          response_rate?: number | null
          profile_views?: number | null
          total_earnings?: number | null
          available_earnings?: number | null
          escrow_earnings?: number | null
          is_available?: boolean | null
          google_oauth_id?: string | null
          created_at?: string | null
          updated_at?: string | null
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
          status: ContractStatus | null
          terms_and_conditions: string | null
          signed_by_customer: boolean | null
          signed_by_vendor: boolean | null
          customer_signature_date: string | null
          vendor_signature_date: string | null
          document_url: string | null
          created_at: string | null
          updated_at: string | null
          defect_liability_days: number | null
          defect_liability_end_date: string | null
          termination_status: string | null
          termination_date: string | null
          notice_period_days: number | null
          credential_log: Json | null
          offboarding_checklist: Json | null
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
          status?: ContractStatus | null
          terms_and_conditions?: string | null
          signed_by_customer?: boolean | null
          signed_by_vendor?: boolean | null
          customer_signature_date?: string | null
          vendor_signature_date?: string | null
          document_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          defect_liability_days?: number | null
          defect_liability_end_date?: string | null
          termination_status?: string | null
          termination_date?: string | null
          notice_period_days?: number | null
          credential_log?: Json | null
          offboarding_checklist?: Json | null
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
          status?: ContractStatus | null
          terms_and_conditions?: string | null
          signed_by_customer?: boolean | null
          signed_by_vendor?: boolean | null
          customer_signature_date?: string | null
          vendor_signature_date?: string | null
          document_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          defect_liability_days?: number | null
          defect_liability_end_date?: string | null
          termination_status?: string | null
          termination_date?: string | null
          notice_period_days?: number | null
          credential_log?: Json | null
          offboarding_checklist?: Json | null
        }
      }
      customer_team_members: {
        Row: {
          id: string
          customer_id: string
          email: string
          name: string | null
          role: string
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          email: string
          name?: string | null
          role?: string
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          email?: string
          name?: string | null
          role?: string
          status?: string
          created_at?: string | null
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
          country: string | null
          timezone: string | null
          total_spent: number | null
          active_projects_count: number | null
          created_at: string | null
          updated_at: string | null
          legal_entity_name: string | null
          trading_name: string | null
          industry: string | null
          headcount_band: string | null
          billing_address: string | null
          vat_number: string | null
          companies_house_number: string | null
          logo_url: string | null
          on_time_payment_rate: number | null
          payment_events_count: number | null
          late_payment_count: number | null
        }
        Insert: {
          id: string
          company_name: string
          company_website?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          timezone?: string | null
          total_spent?: number | null
          active_projects_count?: number | null
          created_at?: string | null
          updated_at?: string | null
          legal_entity_name?: string | null
          trading_name?: string | null
          industry?: string | null
          headcount_band?: string | null
          billing_address?: string | null
          vat_number?: string | null
          companies_house_number?: string | null
          logo_url?: string | null
          on_time_payment_rate?: number | null
          payment_events_count?: number | null
          late_payment_count?: number | null
        }
        Update: {
          id?: string
          company_name?: string
          company_website?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          timezone?: string | null
          total_spent?: number | null
          active_projects_count?: number | null
          created_at?: string | null
          updated_at?: string | null
          legal_entity_name?: string | null
          trading_name?: string | null
          industry?: string | null
          headcount_band?: string | null
          billing_address?: string | null
          vat_number?: string | null
          companies_house_number?: string | null
          logo_url?: string | null
          on_time_payment_rate?: number | null
          payment_events_count?: number | null
          late_payment_count?: number | null
        }
      }
      disputes: {
        Row: {
          id: string
          engagement_id: string | null
          milestone_id: string | null
          flag_id: string | null
          buyer_id: string
          vendor_id: string
          opened_by: string
          opened_by_role: string
          reason: string
          description: string
          escrow_amount: number | null
          status: string
          bilateral_deadline: string
          vendor_position: string | null
          buyer_position: string | null
          resolution: string | null
          split_vendor_pct: number | null
          resolution_notes: string | null
          resolved_by: string | null
          opened_at: string | null
          resolved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          engagement_id?: string | null
          milestone_id?: string | null
          flag_id?: string | null
          buyer_id: string
          vendor_id: string
          opened_by: string
          opened_by_role: string
          reason: string
          description: string
          escrow_amount?: number | null
          status?: string
          bilateral_deadline: string
          vendor_position?: string | null
          buyer_position?: string | null
          resolution?: string | null
          split_vendor_pct?: number | null
          resolution_notes?: string | null
          resolved_by?: string | null
          opened_at?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          engagement_id?: string | null
          milestone_id?: string | null
          flag_id?: string | null
          buyer_id?: string
          vendor_id?: string
          opened_by?: string
          opened_by_role?: string
          reason?: string
          description?: string
          escrow_amount?: number | null
          status?: string
          bilateral_deadline?: string
          vendor_position?: string | null
          buyer_position?: string | null
          resolution?: string | null
          split_vendor_pct?: number | null
          resolution_notes?: string | null
          resolved_by?: string | null
          opened_at?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
      }
      engagements: {
        Row: {
          id: string
          buyer_id: string
          vendor_id: string
          project_title: string | null
          status: string | null
          engagement_type: string | null
          parent_engagement_id: string | null
          working_location: string | null
          service_live_date: string | null
          replacement_sla_days: number | null
          replacement_opened_at: string | null
          minimum_contract_months: number | null
          minimum_engagement_months: number | null
          equipment_provider: string | null
          created_at: string | null
          contract_id: string | null
          sow_id: string | null
          proposal_id: string | null
          package_id: string | null
          job_id: string | null
          source: string | null
          payment_model: string | null
          monthly_amount: number | null
          charge_day: number | null
          total_value: number | null
          start_date: string | null
          end_date: string | null
          ir35_status: string | null
          ir35_stamped_by: string | null
          ir35_stamped_at: string | null
          assigned_employee_id: string | null
          defect_liability_end_date: string | null
          closed_at: string | null
        }
        Insert: {
          id?: string
          buyer_id: string
          vendor_id: string
          project_title?: string | null
          status?: string | null
          engagement_type?: string | null
          parent_engagement_id?: string | null
          working_location?: string | null
          service_live_date?: string | null
          replacement_sla_days?: number | null
          replacement_opened_at?: string | null
          minimum_contract_months?: number | null
          minimum_engagement_months?: number | null
          equipment_provider?: string | null
          created_at?: string | null
          contract_id?: string | null
          sow_id?: string | null
          proposal_id?: string | null
          package_id?: string | null
          job_id?: string | null
          source?: string | null
          payment_model?: string | null
          monthly_amount?: number | null
          charge_day?: number | null
          total_value?: number | null
          start_date?: string | null
          end_date?: string | null
          ir35_status?: string | null
          ir35_stamped_by?: string | null
          ir35_stamped_at?: string | null
          assigned_employee_id?: string | null
          defect_liability_end_date?: string | null
          closed_at?: string | null
        }
        Update: {
          id?: string
          buyer_id?: string
          vendor_id?: string
          project_title?: string | null
          status?: string | null
          engagement_type?: string | null
          parent_engagement_id?: string | null
          working_location?: string | null
          service_live_date?: string | null
          replacement_sla_days?: number | null
          replacement_opened_at?: string | null
          minimum_contract_months?: number | null
          minimum_engagement_months?: number | null
          equipment_provider?: string | null
          created_at?: string | null
          contract_id?: string | null
          sow_id?: string | null
          proposal_id?: string | null
          package_id?: string | null
          job_id?: string | null
          source?: string | null
          payment_model?: string | null
          monthly_amount?: number | null
          charge_day?: number | null
          total_value?: number | null
          start_date?: string | null
          end_date?: string | null
          ir35_status?: string | null
          ir35_stamped_by?: string | null
          ir35_stamped_at?: string | null
          assigned_employee_id?: string | null
          defect_liability_end_date?: string | null
          closed_at?: string | null
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
          status: string | null
          responded_at: string | null
          created_at: string | null
          enquiry_type: string | null
          title: string | null
          service_type: string | null
          budget_from: number | null
          budget_to: number | null
          start_date: string | null
          end_date: string | null
          tech_stack: Json | null
          team_size: string | null
          engagement_model: string | null
          attachment_url: string | null
          expected_output: string | null
          pending_engagement_id: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          vendor_id: string
          subject: string
          message: string
          customer_email: string
          customer_phone?: string | null
          status?: string | null
          responded_at?: string | null
          created_at?: string | null
          enquiry_type?: string | null
          title?: string | null
          service_type?: string | null
          budget_from?: number | null
          budget_to?: number | null
          start_date?: string | null
          end_date?: string | null
          tech_stack?: Json | null
          team_size?: string | null
          engagement_model?: string | null
          attachment_url?: string | null
          expected_output?: string | null
          pending_engagement_id?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          vendor_id?: string
          subject?: string
          message?: string
          customer_email?: string
          customer_phone?: string | null
          status?: string | null
          responded_at?: string | null
          created_at?: string | null
          enquiry_type?: string | null
          title?: string | null
          service_type?: string | null
          budget_from?: number | null
          budget_to?: number | null
          start_date?: string | null
          end_date?: string | null
          tech_stack?: Json | null
          team_size?: string | null
          engagement_model?: string | null
          attachment_url?: string | null
          expected_output?: string | null
          pending_engagement_id?: string | null
          expires_at?: string | null
        }
      }
      escrow_transactions: {
        Row: {
          id: string
          engagement_id: string | null
          milestone_id: string | null
          buyer_id: string
          vendor_id: string
          transaction_type: string
          amount: number
          platform_fee_amount: number | null
          net_amount: number | null
          card_last4: string | null
          reference: string | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          engagement_id?: string | null
          milestone_id?: string | null
          buyer_id: string
          vendor_id: string
          transaction_type: string
          amount: number
          platform_fee_amount?: number | null
          net_amount?: number | null
          card_last4?: string | null
          reference?: string | null
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          engagement_id?: string | null
          milestone_id?: string | null
          buyer_id?: string
          vendor_id?: string
          transaction_type?: string
          amount?: number
          platform_fee_amount?: number | null
          net_amount?: number | null
          card_last4?: string | null
          reference?: string | null
          status?: string
          created_at?: string | null
        }
      }
      evidence: {
        Row: {
          id: string
          milestone_id: string | null
          vendor_id: string | null
          engagement_id: string | null
          delivery_description: string | null
          demo_url: string | null
          files: Json | null
          submitted_at: string | null
          status: string | null
          criteria_checklist: Json | null
          executive_summary: string | null
          approach: string | null
          locked: boolean | null
          reviewed_at: string | null
          review_outcome: string | null
        }
        Insert: {
          id?: string
          milestone_id?: string | null
          vendor_id?: string | null
          engagement_id?: string | null
          delivery_description?: string | null
          demo_url?: string | null
          files?: Json | null
          submitted_at?: string | null
          status?: string | null
          criteria_checklist?: Json | null
          executive_summary?: string | null
          approach?: string | null
          locked?: boolean | null
          reviewed_at?: string | null
          review_outcome?: string | null
        }
        Update: {
          id?: string
          milestone_id?: string | null
          vendor_id?: string | null
          engagement_id?: string | null
          delivery_description?: string | null
          demo_url?: string | null
          files?: Json | null
          submitted_at?: string | null
          status?: string | null
          criteria_checklist?: Json | null
          executive_summary?: string | null
          approach?: string | null
          locked?: boolean | null
          reviewed_at?: string | null
          review_outcome?: string | null
        }
      }
      hourly_logs: {
        Row: {
          id: string
          engagement_id: string
          vendor_id: string
          employee_id: string | null
          log_date: string
          hours: number
          description: string
          status: string
          flag_note: string | null
          invoice_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          engagement_id: string
          vendor_id: string
          employee_id?: string | null
          log_date: string
          hours: number
          description: string
          status?: string
          flag_note?: string | null
          invoice_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          engagement_id?: string
          vendor_id?: string
          employee_id?: string | null
          log_date?: string
          hours?: number
          description?: string
          status?: string
          flag_note?: string | null
          invoice_id?: string | null
          created_at?: string | null
        }
      }
      industries: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string | null
        }
      }
      interview_requests: {
        Row: {
          id: string
          buyer_id: string
          vendor_id: string
          employee_id: string
          enquiry_id: string | null
          interview_type: string
          format: string
          proposed_times: Json
          alternative_times: Json | null
          confirmed_time: string | null
          status: string
          respond_by: string
          created_at: string | null
        }
        Insert: {
          id?: string
          buyer_id: string
          vendor_id: string
          employee_id: string
          enquiry_id?: string | null
          interview_type?: string
          format?: string
          proposed_times: Json
          alternative_times?: Json | null
          confirmed_time?: string | null
          status?: string
          respond_by: string
          created_at?: string | null
        }
        Update: {
          id?: string
          buyer_id?: string
          vendor_id?: string
          employee_id?: string
          enquiry_id?: string | null
          interview_type?: string
          format?: string
          proposed_times?: Json
          alternative_times?: Json | null
          confirmed_time?: string | null
          status?: string
          respond_by?: string
          created_at?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          engagement_id: string | null
          milestone_id: string | null
          buyer_id: string
          vendor_id: string
          description: string | null
          period_label: string | null
          gross_amount: number
          platform_fee_pct: number | null
          platform_fee_amount: number | null
          net_amount: number | null
          vat_amount: number | null
          status: string
          issued_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          invoice_number: string
          engagement_id?: string | null
          milestone_id?: string | null
          buyer_id: string
          vendor_id: string
          description?: string | null
          period_label?: string | null
          gross_amount: number
          platform_fee_pct?: number | null
          platform_fee_amount?: number | null
          net_amount?: number | null
          vat_amount?: number | null
          status?: string
          issued_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string
          engagement_id?: string | null
          milestone_id?: string | null
          buyer_id?: string
          vendor_id?: string
          description?: string | null
          period_label?: string | null
          gross_amount?: number
          platform_fee_pct?: number | null
          platform_fee_amount?: number | null
          net_amount?: number | null
          vat_amount?: number | null
          status?: string
          issued_at?: string | null
          created_at?: string | null
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
          uploaded_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string | null
        }
      }
      job_skills: {
        Row: {
          id: string
          job_id: string
          skill_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          skill_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          skill_id?: string
          created_at?: string | null
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
          currency: string | null
          timeline: string | null
          experience_level: ExperienceLevel | null
          project_type: ProjectType
          location: string | null
          status: JobStatus | null
          proposals_count: number | null
          views_count: number | null
          posted_at: string | null
          closed_at: string | null
          created_at: string | null
          updated_at: string | null
          visibility: string | null
          invited_vendor_ids: Json | null
          job_kind: string | null
          tender_title: string | null
          nda_required: boolean | null
          submission_deadline: string | null
          tender_document_url: string | null
          evaluation_criteria: Json | null
          admin_status: string | null
          service_type: string | null
          engagement_model: string | null
          tech_stack: Json | null
          team_size: string | null
          budget_from: number | null
          budget_to: number | null
          start_date: string | null
          end_date: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          title: string
          description: string
          category?: string | null
          budget_type: BudgetType
          budget_amount: number
          currency?: string | null
          timeline?: string | null
          experience_level?: ExperienceLevel | null
          project_type: ProjectType
          location?: string | null
          status?: JobStatus | null
          proposals_count?: number | null
          views_count?: number | null
          posted_at?: string | null
          closed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          visibility?: string | null
          invited_vendor_ids?: Json | null
          job_kind?: string | null
          tender_title?: string | null
          nda_required?: boolean | null
          submission_deadline?: string | null
          tender_document_url?: string | null
          evaluation_criteria?: Json | null
          admin_status?: string | null
          service_type?: string | null
          engagement_model?: string | null
          tech_stack?: Json | null
          team_size?: string | null
          budget_from?: number | null
          budget_to?: number | null
          start_date?: string | null
          end_date?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          title?: string
          description?: string
          category?: string | null
          budget_type?: BudgetType
          budget_amount?: number
          currency?: string | null
          timeline?: string | null
          experience_level?: ExperienceLevel | null
          project_type?: ProjectType
          location?: string | null
          status?: JobStatus | null
          proposals_count?: number | null
          views_count?: number | null
          posted_at?: string | null
          closed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          visibility?: string | null
          invited_vendor_ids?: Json | null
          job_kind?: string | null
          tender_title?: string | null
          nda_required?: boolean | null
          submission_deadline?: string | null
          tender_document_url?: string | null
          evaluation_criteria?: Json | null
          admin_status?: string | null
          service_type?: string | null
          engagement_model?: string | null
          tech_stack?: Json | null
          team_size?: string | null
          budget_from?: number | null
          budget_to?: number | null
          start_date?: string | null
          end_date?: string | null
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
          uploaded_at: string | null
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          subject: string | null
          content: string
          is_read: boolean | null
          read_at: string | null
          parent_message_id: string | null
          project_id: string | null
          created_at: string | null
          engagement_id: string | null
          enquiry_id: string | null
          thread_type: string | null
          flagged_off_platform: boolean | null
          dispute_id: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          subject?: string | null
          content: string
          is_read?: boolean | null
          read_at?: string | null
          parent_message_id?: string | null
          project_id?: string | null
          created_at?: string | null
          engagement_id?: string | null
          enquiry_id?: string | null
          thread_type?: string | null
          flagged_off_platform?: boolean | null
          dispute_id?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          subject?: string | null
          content?: string
          is_read?: boolean | null
          read_at?: string | null
          parent_message_id?: string | null
          project_id?: string | null
          created_at?: string | null
          engagement_id?: string | null
          enquiry_id?: string | null
          thread_type?: string | null
          flagged_off_platform?: boolean | null
          dispute_id?: string | null
        }
      }
      milestone_flags: {
        Row: {
          id: string
          engagement_id: string | null
          milestone_id: string | null
          check_in_id: string | null
          hourly_log_ids: Json | null
          flagged_by: string
          flagged_criteria: Json | null
          note: string | null
          status: string
          respond_by: string
          vendor_response: string | null
          resolved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          engagement_id?: string | null
          milestone_id?: string | null
          check_in_id?: string | null
          hourly_log_ids?: Json | null
          flagged_by: string
          flagged_criteria?: Json | null
          note?: string | null
          status?: string
          respond_by: string
          vendor_response?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          engagement_id?: string | null
          milestone_id?: string | null
          check_in_id?: string | null
          hourly_log_ids?: Json | null
          flagged_by?: string
          flagged_criteria?: Json | null
          note?: string | null
          status?: string
          respond_by?: string
          vendor_response?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
      }
      notification_prefs: {
        Row: {
          user_id: string
          prefs: Json
          updated_at: string | null
        }
        Insert: {
          user_id: string
          prefs?: Json
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          prefs?: Json
          updated_at?: string | null
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
          is_read: boolean | null
          read_at: string | null
          related_job_id: string | null
          related_project_id: string | null
          related_proposal_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          link_url?: string | null
          is_read?: boolean | null
          read_at?: string | null
          related_job_id?: string | null
          related_project_id?: string | null
          related_proposal_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          message?: string
          link_url?: string | null
          is_read?: boolean | null
          read_at?: string | null
          related_job_id?: string | null
          related_project_id?: string | null
          related_proposal_id?: string | null
          created_at?: string | null
        }
      }
      partner_invites: {
        Row: {
          id: string
          inviter_id: string
          inviter_role: string
          company_name: string
          contact_name: string | null
          contact_email: string
          note: string | null
          status: string
          linked_profile_id: string | null
          expires_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          inviter_id: string
          inviter_role: string
          company_name: string
          contact_name?: string | null
          contact_email: string
          note?: string | null
          status?: string
          linked_profile_id?: string | null
          expires_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          inviter_id?: string
          inviter_role?: string
          company_name?: string
          contact_name?: string | null
          contact_email?: string
          note?: string | null
          status?: string
          linked_profile_id?: string | null
          expires_at?: string | null
          created_at?: string | null
        }
      }
      payment_methods: {
        Row: {
          id: string
          customer_id: string
          brand: string
          last4: string
          exp_month: number
          exp_year: number
          is_default: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          brand: string
          last4: string
          exp_month: number
          exp_year: number
          is_default?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          brand?: string
          last4?: string
          exp_month?: number
          exp_year?: number
          is_default?: boolean | null
          created_at?: string | null
        }
      }
      pending_engagement: {
        Row: {
          id: string
          buyer_id: string
          vendor_id: string
          meeting_datetime: string
          search_query: string | null
          status: string | null
          proposal_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          vendor_id: string
          meeting_datetime: string
          search_query?: string | null
          status?: string | null
          proposal_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          vendor_id?: string
          meeting_datetime?: string
          search_query?: string | null
          status?: string | null
          proposal_id?: string | null
          created_at?: string
        }
      }
      platform_event: {
        Row: {
          event_id: string
          event_type: string
          actor_id: string
          actor_role: string
          entity_type: string
          entity_id: string
          payload: Json | null
          timestamp: string
          outcome: string | null
        }
        Insert: {
          event_id?: string
          event_type: string
          actor_id: string
          actor_role: string
          entity_type: string
          entity_id: string
          payload?: Json | null
          timestamp?: string
          outcome?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          actor_id?: string
          actor_role?: string
          entity_type?: string
          entity_id?: string
          payload?: Json | null
          timestamp?: string
          outcome?: string | null
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
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          contractor_id: string
          title: string
          description?: string | null
          image_url?: string | null
          project_url?: string | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          contractor_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          project_url?: string | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          user_type: UserType
          email: string
          full_name: string
          profile_picture_url: string | null
          profile_completed: boolean | null
          onboarding_step: number | null
          verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          user_type: UserType
          email: string
          full_name: string
          profile_picture_url?: string | null
          profile_completed?: boolean | null
          onboarding_step?: number | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_type?: UserType
          email?: string
          full_name?: string
          profile_picture_url?: string | null
          profile_completed?: boolean | null
          onboarding_step?: number | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
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
          completed: boolean | null
          completed_at: string | null
          display_order: number | null
          created_at: string | null
          updated_at: string | null
          acceptance_criteria: Json | null
          jira_epic_id: string | null
          github_repo: string | null
          engagement_id: string | null
          milestone_type: string | null
          escrow_status: string | null
          funded_at: string | null
          submitted_at: string | null
          accepted_at: string | null
          released_at: string | null
          auto_release_at: string | null
          rejection_reason: string | null
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          amount?: number | null
          due_date?: string | null
          completed?: boolean | null
          completed_at?: string | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
          acceptance_criteria?: Json | null
          jira_epic_id?: string | null
          github_repo?: string | null
          engagement_id?: string | null
          milestone_type?: string | null
          escrow_status?: string | null
          funded_at?: string | null
          submitted_at?: string | null
          accepted_at?: string | null
          released_at?: string | null
          auto_release_at?: string | null
          rejection_reason?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          amount?: number | null
          due_date?: string | null
          completed?: boolean | null
          completed_at?: string | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
          acceptance_criteria?: Json | null
          jira_epic_id?: string | null
          github_repo?: string | null
          engagement_id?: string | null
          milestone_type?: string | null
          escrow_status?: string | null
          funded_at?: string | null
          submitted_at?: string | null
          accepted_at?: string | null
          released_at?: string | null
          auto_release_at?: string | null
          rejection_reason?: string | null
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
          progress: number | null
          status: ProjectStatus | null
          start_date: string
          deadline: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
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
          progress?: number | null
          status?: ProjectStatus | null
          start_date: string
          deadline?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
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
          progress?: number | null
          status?: ProjectStatus | null
          start_date?: string
          deadline?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      proposals: {
        Row: {
          id: string
          job_id: string | null
          contractor_id: string | null
          proposal_content: string
          cover_letter: string | null
          proposed_budget: number
          proposed_timeline: string
          proposal_score: number | null
          status: ProposalStatus | null
          ai_generated: boolean | null
          submitted_at: string | null
          updated_at: string | null
          vendor_id: string | null
          customer_id: string | null
          enquiry_id: string | null
          pending_engagement_id: string | null
          proposal_kind: string | null
          approach_summary: string | null
          proposed_team: Json | null
          milestones: Json | null
          assumptions: string | null
          exclusions: string | null
          spec_structure: Json | null
          discovery_fee: number | null
          timeline_days: number | null
          workflow_state: string | null
          expires_at: string | null
          accepted_at: string | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          contractor_id?: string | null
          proposal_content: string
          cover_letter?: string | null
          proposed_budget: number
          proposed_timeline: string
          proposal_score?: number | null
          status?: ProposalStatus | null
          ai_generated?: boolean | null
          submitted_at?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          customer_id?: string | null
          enquiry_id?: string | null
          pending_engagement_id?: string | null
          proposal_kind?: string | null
          approach_summary?: string | null
          proposed_team?: Json | null
          milestones?: Json | null
          assumptions?: string | null
          exclusions?: string | null
          spec_structure?: Json | null
          discovery_fee?: number | null
          timeline_days?: number | null
          workflow_state?: string | null
          expires_at?: string | null
          accepted_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string | null
          contractor_id?: string | null
          proposal_content?: string
          cover_letter?: string | null
          proposed_budget?: number
          proposed_timeline?: string
          proposal_score?: number | null
          status?: ProposalStatus | null
          ai_generated?: boolean | null
          submitted_at?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          customer_id?: string | null
          enquiry_id?: string | null
          pending_engagement_id?: string | null
          proposal_kind?: string | null
          approach_summary?: string | null
          proposed_team?: Json | null
          milestones?: Json | null
          assumptions?: string | null
          exclusions?: string | null
          spec_structure?: Json | null
          discovery_fee?: number | null
          timeline_days?: number | null
          workflow_state?: string | null
          expires_at?: string | null
          accepted_at?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          customer_id: string | null
          contractor_id: string | null
          vendor_id: string | null
          project_id: string | null
          rating: number
          comment: string | null
          would_recommend: boolean | null
          created_at: string | null
          updated_at: string | null
          engagement_id: string | null
          reviewer_id: string | null
          direction: string | null
          criteria_scores: Json | null
          moderation_status: string | null
          window_closes_at: string | null
        }
        Insert: {
          id?: string
          customer_id?: string | null
          contractor_id?: string | null
          vendor_id?: string | null
          project_id?: string | null
          rating: number
          comment?: string | null
          would_recommend?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          engagement_id?: string | null
          reviewer_id?: string | null
          direction?: string | null
          criteria_scores?: Json | null
          moderation_status?: string | null
          window_closes_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string | null
          contractor_id?: string | null
          vendor_id?: string | null
          project_id?: string | null
          rating?: number
          comment?: string | null
          would_recommend?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          engagement_id?: string | null
          reviewer_id?: string | null
          direction?: string | null
          criteria_scores?: Json | null
          moderation_status?: string | null
          window_closes_at?: string | null
        }
      }
      saved_vendors: {
        Row: {
          id: string
          customer_id: string
          vendor_id: string | null
          contractor_id: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          vendor_id?: string | null
          contractor_id?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          vendor_id?: string | null
          contractor_id?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
      service_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          created_at?: string | null
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          created_at?: string | null
        }
      }
      sow_documents: {
        Row: {
          id: string
          engagement_id: string | null
          contract_id: string | null
          proposal_id: string | null
          buyer_id: string
          vendor_id: string
          vendor_business_type: string | null
          project_title: string | null
          service_type: string | null
          description: string | null
          start_date: string | null
          end_date: string | null
          total_budget: number | null
          milestones: Json | null
          payment_model: string | null
          msp_onboarding: Json | null
          monthly_amount: number | null
          charge_day: number | null
          min_term_months: number | null
          equipment_provider: string | null
          ip_ownership: string | null
          ip_shared_terms: string | null
          working_location: string | null
          ir35_answers: Json | null
          vat_position: string | null
          obligations_summary: string | null
          status: string
          document_url: string | null
          generated_at: string | null
          buyer_signed_at: string | null
          vendor_signed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          engagement_id?: string | null
          contract_id?: string | null
          proposal_id?: string | null
          buyer_id: string
          vendor_id: string
          vendor_business_type?: string | null
          project_title?: string | null
          service_type?: string | null
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          total_budget?: number | null
          milestones?: Json | null
          payment_model?: string | null
          msp_onboarding?: Json | null
          monthly_amount?: number | null
          charge_day?: number | null
          min_term_months?: number | null
          equipment_provider?: string | null
          ip_ownership?: string | null
          ip_shared_terms?: string | null
          working_location?: string | null
          ir35_answers?: Json | null
          vat_position?: string | null
          obligations_summary?: string | null
          status?: string
          document_url?: string | null
          generated_at?: string | null
          buyer_signed_at?: string | null
          vendor_signed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          engagement_id?: string | null
          contract_id?: string | null
          proposal_id?: string | null
          buyer_id?: string
          vendor_id?: string
          vendor_business_type?: string | null
          project_title?: string | null
          service_type?: string | null
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          total_budget?: number | null
          milestones?: Json | null
          payment_model?: string | null
          msp_onboarding?: Json | null
          monthly_amount?: number | null
          charge_day?: number | null
          min_term_months?: number | null
          equipment_provider?: string | null
          ip_ownership?: string | null
          ip_shared_terms?: string | null
          working_location?: string | null
          ir35_answers?: Json | null
          vat_position?: string | null
          obligations_summary?: string | null
          status?: string
          document_url?: string | null
          generated_at?: string | null
          buyer_signed_at?: string | null
          vendor_signed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      terminations: {
        Row: {
          id: string
          engagement_id: string
          contract_id: string | null
          initiated_by: string
          initiated_by_role: string
          reason: string
          notes: string
          notice_period_days: number
          notice_end_date: string
          status: string
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          engagement_id: string
          contract_id?: string | null
          initiated_by: string
          initiated_by_role: string
          reason: string
          notes: string
          notice_period_days: number
          notice_end_date: string
          status?: string
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          engagement_id?: string
          contract_id?: string | null
          initiated_by?: string
          initiated_by_role?: string
          reason?: string
          notes?: string
          notice_period_days?: number
          notice_end_date?: string
          status?: string
          completed_at?: string | null
          created_at?: string | null
        }
      }
      vendor_documents: {
        Row: {
          id: string
          vendor_id: string
          document_type: DocumentType
          document_url: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          uploaded_at: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          document_type: DocumentType
          document_url: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          uploaded_at?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          document_type?: DocumentType
          document_url?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          uploaded_at?: string | null
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
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          job_title: string | null
          seniority: string | null
          core_domain: string | null
          secondary_skills: string[] | null
          years_experience: number | null
          languages: string[] | null
          monthly_rate: number | null
          engagement_type: string | null
          availability_status: string | null
          available_from: string | null
          engaged_until: string | null
          photo_url: string | null
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
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          job_title?: string | null
          seniority?: string | null
          core_domain?: string | null
          secondary_skills?: string[] | null
          years_experience?: number | null
          languages?: string[] | null
          monthly_rate?: number | null
          engagement_type?: string | null
          availability_status?: string | null
          available_from?: string | null
          engaged_until?: string | null
          photo_url?: string | null
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
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          job_title?: string | null
          seniority?: string | null
          core_domain?: string | null
          secondary_skills?: string[] | null
          years_experience?: number | null
          languages?: string[] | null
          monthly_rate?: number | null
          engagement_type?: string | null
          availability_status?: string | null
          available_from?: string | null
          engaged_until?: string | null
          photo_url?: string | null
        }
      }
      vendor_industries: {
        Row: {
          id: string
          vendor_id: string
          industry_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          industry_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          industry_id?: string
          created_at?: string | null
        }
      }
      vendor_packages: {
        Row: {
          id: string
          vendor_id: string
          name: string
          description: string | null
          price: number
          billing_period: string | null
          features: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          description?: string | null
          price: number
          billing_period?: string | null
          features?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          description?: string | null
          price?: number
          billing_period?: string | null
          features?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      vendor_referrals: {
        Row: {
          id: string
          vendor_id: string
          contact_name: string
          job_title: string
          company: string
          work_email: string
          project_vouched_for: string
          project_duration: string | null
          project_value_band: string | null
          relationship_type: string | null
          confirmed: boolean | null
          confirmed_at: string | null
          would_recommend: boolean | null
          specific_outcome: string | null
          written_statement: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          contact_name: string
          job_title: string
          company: string
          work_email: string
          project_vouched_for: string
          project_duration?: string | null
          project_value_band?: string | null
          relationship_type?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          would_recommend?: boolean | null
          specific_outcome?: string | null
          written_statement?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          contact_name?: string
          job_title?: string
          company?: string
          work_email?: string
          project_vouched_for?: string
          project_duration?: string | null
          project_value_band?: string | null
          relationship_type?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          would_recommend?: boolean | null
          specific_outcome?: string | null
          written_statement?: string | null
          created_at?: string | null
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
          created_at: string | null
          updated_at: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          created_at?: string | null
          updated_at?: string | null
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
          country: string | null
          contact_name: string
          contact_email: string
          contact_phone: string
          company_size: string | null
          year_founded: number | null
          employee_count: number | null
          projects_completed: number | null
          years_in_business: number | null
          hourly_rate: number | null
          monthly_rate: number | null
          rating: number | null
          review_count: number | null
          response_time: string | null
          total_revenue: number | null
          active_contracts_count: number | null
          is_verified: boolean | null
          bank_name: string | null
          account_number: string | null
          ifsc_code: string | null
          bank_address: string | null
          registered_email: string | null
          registered_name: string | null
          created_at: string | null
          updated_at: string | null
          profile_view_count: number | null
          ai_keyword_tags: Json | null
          ir35_compliant: boolean | null
          gdpr_ready: boolean | null
          minimum_project_value: number | null
          referral_count: number | null
          monthly_rate_min: number | null
          monthly_rate_max: number | null
          hourly_rate_min: number | null
          hourly_rate_max: number | null
          business_type: string | null
          tech_stack: Json | null
          service_categories: Json | null
          engagement_models: Json | null
          availability_status: string | null
          availability_from: string | null
          response_time_hours: number | null
          timezone: string | null
          languages: Json | null
          operating_locations: Json | null
          industry_focus: Json | null
          verification_status: string | null
          verified_at: string | null
          founded_year: number | null
          team_size_band: string | null
          stripe_connect_status: string | null
          stripe_connected_at: string | null
          booking_method: string | null
          calendly_url: string | null
          dispute_outcome_count: number | null
          non_response_count: number | null
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
          country?: string | null
          contact_name: string
          contact_email: string
          contact_phone: string
          company_size?: string | null
          year_founded?: number | null
          employee_count?: number | null
          projects_completed?: number | null
          years_in_business?: number | null
          hourly_rate?: number | null
          monthly_rate?: number | null
          rating?: number | null
          review_count?: number | null
          response_time?: string | null
          total_revenue?: number | null
          active_contracts_count?: number | null
          is_verified?: boolean | null
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          bank_address?: string | null
          registered_email?: string | null
          registered_name?: string | null
          created_at?: string | null
          updated_at?: string | null
          profile_view_count?: number | null
          ai_keyword_tags?: Json | null
          ir35_compliant?: boolean | null
          gdpr_ready?: boolean | null
          minimum_project_value?: number | null
          referral_count?: number | null
          monthly_rate_min?: number | null
          monthly_rate_max?: number | null
          hourly_rate_min?: number | null
          hourly_rate_max?: number | null
          business_type?: string | null
          tech_stack?: Json | null
          service_categories?: Json | null
          engagement_models?: Json | null
          availability_status?: string | null
          availability_from?: string | null
          response_time_hours?: number | null
          timezone?: string | null
          languages?: Json | null
          operating_locations?: Json | null
          industry_focus?: Json | null
          verification_status?: string | null
          verified_at?: string | null
          founded_year?: number | null
          team_size_band?: string | null
          stripe_connect_status?: string | null
          stripe_connected_at?: string | null
          booking_method?: string | null
          calendly_url?: string | null
          dispute_outcome_count?: number | null
          non_response_count?: number | null
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
          country?: string | null
          contact_name?: string
          contact_email?: string
          contact_phone?: string
          company_size?: string | null
          year_founded?: number | null
          employee_count?: number | null
          projects_completed?: number | null
          years_in_business?: number | null
          hourly_rate?: number | null
          monthly_rate?: number | null
          rating?: number | null
          review_count?: number | null
          response_time?: string | null
          total_revenue?: number | null
          active_contracts_count?: number | null
          is_verified?: boolean | null
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          bank_address?: string | null
          registered_email?: string | null
          registered_name?: string | null
          created_at?: string | null
          updated_at?: string | null
          profile_view_count?: number | null
          ai_keyword_tags?: Json | null
          ir35_compliant?: boolean | null
          gdpr_ready?: boolean | null
          minimum_project_value?: number | null
          referral_count?: number | null
          monthly_rate_min?: number | null
          monthly_rate_max?: number | null
          hourly_rate_min?: number | null
          hourly_rate_max?: number | null
          business_type?: string | null
          tech_stack?: Json | null
          service_categories?: Json | null
          engagement_models?: Json | null
          availability_status?: string | null
          availability_from?: string | null
          response_time_hours?: number | null
          timezone?: string | null
          languages?: Json | null
          operating_locations?: Json | null
          industry_focus?: Json | null
          verification_status?: string | null
          verified_at?: string | null
          founded_year?: number | null
          team_size_band?: string | null
          stripe_connect_status?: string | null
          stripe_connected_at?: string | null
          booking_method?: string | null
          calendly_url?: string | null
          dispute_outcome_count?: number | null
          non_response_count?: number | null
        }
      }
      weekly_status_log: {
        Row: {
          id: string
          engagement_id: string
          vendor_id: string
          week_of: string
          status_text: string
          submitted_at: string
        }
        Insert: {
          id?: string
          engagement_id: string
          vendor_id: string
          week_of: string
          status_text: string
          submitted_at?: string
        }
        Update: {
          id?: string
          engagement_id?: string
          vendor_id?: string
          week_of?: string
          status_text?: string
          submitted_at?: string
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
