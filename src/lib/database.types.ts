
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "accesos_perfil": {
                  Row: {
                    "abierto_en": string,"id": number,"ip_hash": string | null,"perfil_compartido_id": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "abierto_en"?: string,"id"?: never,"ip_hash"?: string | null,"perfil_compartido_id": string,"user_agent"?: string | null
                  }
                  Update: {
                    "abierto_en"?: string,"id"?: never,"ip_hash"?: string | null,"perfil_compartido_id"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "accesos_perfil_perfil_compartido_id_fkey"
      columns: ["perfil_compartido_id"]
isOneToOne: false
      referencedRelation: "perfiles_compartidos"
      referencedColumns: ["id"]
    }
                  ]
                },"arriendos_anteriores": {
                  Row: {
                    "actualizado_en": string,"ciudad": string,"contrato_id": string | null,"creado_en": string,"desde": string,"direccion": string,"hasta": string | null,"id": string,"inquilino_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizado_en"?: string,"ciudad": string,"contrato_id"?: string | null,"creado_en"?: string,"desde": string,"direccion": string,"hasta"?: string | null,"id"?: string,"inquilino_id"?: string
                  }
                  Update: {
                    "actualizado_en"?: string,"ciudad"?: string,"contrato_id"?: string | null,"creado_en"?: string,"desde"?: string,"direccion"?: string,"hasta"?: string | null,"id"?: string,"inquilino_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "arriendos_anteriores_contrato_id_fkey"
      columns: ["contrato_id"]
isOneToOne: false
      referencedRelation: "contratos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "arriendos_anteriores_inquilino_id_fkey"
      columns: ["inquilino_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"contratos": {
                  Row: {
                    "actualizado_en": string,"arrendador_id": string,"canon": number,"creado_en": string,"dia_pago": number,"estado": Database["public"]['Enums']["estado_contrato"],"fecha_fin": string,"fecha_inicio": string,"firmado_path": string | null,"garantia_tipo": Database["public"]['Enums']["garantia_tipo"] | null,"id": string,"inmueble_id": string,"inquilino_id": string | null,"pdf_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizado_en"?: string,"arrendador_id"?: string,"canon": number,"creado_en"?: string,"dia_pago": number,"estado"?: Database["public"]['Enums']["estado_contrato"],"fecha_fin": string,"fecha_inicio": string,"firmado_path"?: string | null,"garantia_tipo"?: Database["public"]['Enums']["garantia_tipo"] | null,"id"?: string,"inmueble_id": string,"inquilino_id"?: string | null,"pdf_path"?: string | null
                  }
                  Update: {
                    "actualizado_en"?: string,"arrendador_id"?: string,"canon"?: number,"creado_en"?: string,"dia_pago"?: number,"estado"?: Database["public"]['Enums']["estado_contrato"],"fecha_fin"?: string,"fecha_inicio"?: string,"firmado_path"?: string | null,"garantia_tipo"?: Database["public"]['Enums']["garantia_tipo"] | null,"id"?: string,"inmueble_id"?: string,"inquilino_id"?: string | null,"pdf_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contratos_arrendador_id_fkey"
      columns: ["arrendador_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contratos_inmueble_id_fkey"
      columns: ["inmueble_id"]
isOneToOne: false
      referencedRelation: "inmuebles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contratos_inquilino_id_fkey"
      columns: ["inquilino_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"inmuebles": {
                  Row: {
                    "actualizado_en": string,"arrendador_id": string,"canon_base": number,"ciudad": string,"creado_en": string,"direccion": string,"id": string,"notas": string | null,"tipo": Database["public"]['Enums']["tipo_inmueble"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizado_en"?: string,"arrendador_id"?: string,"canon_base": number,"ciudad": string,"creado_en"?: string,"direccion": string,"id"?: string,"notas"?: string | null,"tipo": Database["public"]['Enums']["tipo_inmueble"]
                  }
                  Update: {
                    "actualizado_en"?: string,"arrendador_id"?: string,"canon_base"?: number,"ciudad"?: string,"creado_en"?: string,"direccion"?: string,"id"?: string,"notas"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_inmueble"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "inmuebles_arrendador_id_fkey"
      columns: ["arrendador_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"inventarios": {
                  Row: {
                    "aceptado_arrendador_en": string | null,"aceptado_inquilino_en": string | null,"actualizado_en": string,"contrato_id": string,"creado_en": string,"id": string,"tipo": Database["public"]['Enums']["tipo_inventario"]
                  }
                  ComputedFields: never
                  Insert: {
                    "aceptado_arrendador_en"?: string | null,"aceptado_inquilino_en"?: string | null,"actualizado_en"?: string,"contrato_id": string,"creado_en"?: string,"id"?: string,"tipo": Database["public"]['Enums']["tipo_inventario"]
                  }
                  Update: {
                    "aceptado_arrendador_en"?: string | null,"aceptado_inquilino_en"?: string | null,"actualizado_en"?: string,"contrato_id"?: string,"creado_en"?: string,"id"?: string,"tipo"?: Database["public"]['Enums']["tipo_inventario"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventarios_contrato_id_fkey"
      columns: ["contrato_id"]
isOneToOne: false
      referencedRelation: "contratos"
      referencedColumns: ["id"]
    }
                  ]
                },"items_inventario": {
                  Row: {
                    "actualizado_en": string,"ambiente": string,"creado_en": string,"creado_por": string,"descripcion": string,"foto_hash": string | null,"foto_path": string | null,"foto_tomada_en": string | null,"id": string,"inventario_id": string,"orden": number
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizado_en"?: string,"ambiente": string,"creado_en"?: string,"creado_por"?: string,"descripcion": string,"foto_hash"?: string | null,"foto_path"?: string | null,"foto_tomada_en"?: string | null,"id"?: string,"inventario_id": string,"orden"?: number
                  }
                  Update: {
                    "actualizado_en"?: string,"ambiente"?: string,"creado_en"?: string,"creado_por"?: string,"descripcion"?: string,"foto_hash"?: string | null,"foto_path"?: string | null,"foto_tomada_en"?: string | null,"id"?: string,"inventario_id"?: string,"orden"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "items_inventario_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_inventario_inventario_id_fkey"
      columns: ["inventario_id"]
isOneToOne: false
      referencedRelation: "inventarios"
      referencedColumns: ["id"]
    }
                  ]
                },"pagos": {
                  Row: {
                    "actualizado_en": string,"comprobante_path": string | null,"confirmado_en": string | null,"contrato_id": string,"creado_en": string,"estado": Database["public"]['Enums']["estado_pago"],"extraido_ia": Json | null,"fecha_limite": string,"fecha_pago": string | null,"id": string,"periodo": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizado_en"?: string,"comprobante_path"?: string | null,"confirmado_en"?: string | null,"contrato_id": string,"creado_en"?: string,"estado"?: Database["public"]['Enums']["estado_pago"],"extraido_ia"?: Json | null,"fecha_limite": string,"fecha_pago"?: string | null,"id"?: string,"periodo": string,"valor": number
                  }
                  Update: {
                    "actualizado_en"?: string,"comprobante_path"?: string | null,"confirmado_en"?: string | null,"contrato_id"?: string,"creado_en"?: string,"estado"?: Database["public"]['Enums']["estado_pago"],"extraido_ia"?: Json | null,"fecha_limite"?: string,"fecha_pago"?: string | null,"id"?: string,"periodo"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "pagos_contrato_id_fkey"
      columns: ["contrato_id"]
isOneToOne: false
      referencedRelation: "contratos"
      referencedColumns: ["id"]
    }
                  ]
                },"perfiles_compartidos": {
                  Row: {
                    "abierto_en": string | null,"actualizado_en": string,"creado_en": string,"destinatario": string,"id": string,"inquilino_id": string,"revocado_en": string | null,"token_hash": string,"vence_en": string
                  }
                  ComputedFields: never
                  Insert: {
                    "abierto_en"?: string | null,"actualizado_en"?: string,"creado_en"?: string,"destinatario": string,"id"?: string,"inquilino_id"?: string,"revocado_en"?: string | null,"token_hash": string,"vence_en": string
                  }
                  Update: {
                    "abierto_en"?: string | null,"actualizado_en"?: string,"creado_en"?: string,"destinatario"?: string,"id"?: string,"inquilino_id"?: string,"revocado_en"?: string | null,"token_hash"?: string,"vence_en"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "perfiles_compartidos_inquilino_id_fkey"
      columns: ["inquilino_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"referencias": {
                  Row: {
                    "acepta_contacto": boolean | null,"actualizado_en": string,"arriendo_anterior_id": string,"autorizo_datos_en": string | null,"canal": Database["public"]['Enums']["canal_referencia"],"canal_contacto": Database["public"]['Enums']["canal_contacto"] | null,"comentario": string | null,"contacto": string,"contacto_nombre": string,"creado_en": string,"entrego_buen_estado": boolean | null,"id": string,"nivel": Database["public"]['Enums']["nivel_referencia"] | null,"oculta": boolean,"pagaba_a_tiempo": boolean | null,"respondida_en": string | null,"soporte_path": string | null,"token_hash": string,"vence_en": string,"volveria_a_arrendar": boolean | null
                  }
                  ComputedFields: never
                  Insert: {
                    "acepta_contacto"?: boolean | null,"actualizado_en"?: string,"arriendo_anterior_id": string,"autorizo_datos_en"?: string | null,"canal": Database["public"]['Enums']["canal_referencia"],"canal_contacto"?: Database["public"]['Enums']["canal_contacto"] | null,"comentario"?: string | null,"contacto": string,"contacto_nombre": string,"creado_en"?: string,"entrego_buen_estado"?: boolean | null,"id"?: string,"nivel"?: Database["public"]['Enums']["nivel_referencia"] | null,"oculta"?: boolean,"pagaba_a_tiempo"?: boolean | null,"respondida_en"?: string | null,"soporte_path"?: string | null,"token_hash": string,"vence_en": string,"volveria_a_arrendar"?: boolean | null
                  }
                  Update: {
                    "acepta_contacto"?: boolean | null,"actualizado_en"?: string,"arriendo_anterior_id"?: string,"autorizo_datos_en"?: string | null,"canal"?: Database["public"]['Enums']["canal_referencia"],"canal_contacto"?: Database["public"]['Enums']["canal_contacto"] | null,"comentario"?: string | null,"contacto"?: string,"contacto_nombre"?: string,"creado_en"?: string,"entrego_buen_estado"?: boolean | null,"id"?: string,"nivel"?: Database["public"]['Enums']["nivel_referencia"] | null,"oculta"?: boolean,"pagaba_a_tiempo"?: boolean | null,"respondida_en"?: string | null,"soporte_path"?: string | null,"token_hash"?: string,"vence_en"?: string,"volveria_a_arrendar"?: boolean | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "referencias_arriendo_anterior_id_fkey"
      columns: ["arriendo_anterior_id"]
isOneToOne: false
      referencedRelation: "arriendos_anteriores"
      referencedColumns: ["id"]
    }
                  ]
                },"usuarios": {
                  Row: {
                    "acepto_datos_en": string | null,"actualizado_en": string,"creado_en": string,"es_arrendador": boolean,"es_inquilino": boolean,"id": string,"nombre": string | null,"telefono": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "acepto_datos_en"?: string | null,"actualizado_en"?: string,"creado_en"?: string,"es_arrendador"?: boolean,"es_inquilino"?: boolean,"id": string,"nombre"?: string | null,"telefono"?: string | null
                  }
                  Update: {
                    "acepto_datos_en"?: string | null,"actualizado_en"?: string,"creado_en"?: string,"es_arrendador"?: boolean,"es_inquilino"?: boolean,"id"?: string,"nombre"?: string | null,"telefono"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "canal_contacto": "telefono"|"whatsapp"|"correo","canal_referencia": "whatsapp"|"sms"|"correo","estado_contrato": "borrador"|"activo"|"terminado"|"cancelado","estado_pago": "pendiente"|"reportado"|"confirmado"|"rechazado","garantia_tipo": "codeudor"|"poliza"|"servicios_publicos","nivel_referencia": "declarada"|"con_soporte"|"verificada","tipo_inmueble": "apartamento"|"apartaestudio"|"casa"|"habitacion"|"local"|"otro","tipo_inventario": "entrega"|"devolucion"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "canal_contacto": ["telefono", "whatsapp", "correo"],"canal_referencia": ["whatsapp", "sms", "correo"],"estado_contrato": ["borrador", "activo", "terminado", "cancelado"],"estado_pago": ["pendiente", "reportado", "confirmado", "rechazado"],"garantia_tipo": ["codeudor", "poliza", "servicios_publicos"],"nivel_referencia": ["declarada", "con_soporte", "verificada"],"tipo_inmueble": ["apartamento", "apartaestudio", "casa", "habitacion", "local", "otro"],"tipo_inventario": ["entrega", "devolucion"]
          }
        }
} as const
