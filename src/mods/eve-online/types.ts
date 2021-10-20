export type Scope = 'esi-alliances.read_contacts.v1'
  | 'esi-assets.read_assets.v1'
  | 'esi-assets.read_corporation_assets.v1'
  | 'esi-bookmarks.read_character_bookmarks.v1'
  | 'esi-bookmarks.read_corporation_bookmarks.v1'
  | 'esi-calendar.read_calendar_events.v1'
  | 'esi-calendar.respond_calendar_events.v1'
  | 'esi-characters.read_agents_research.v1'
  | 'esi-characters.read_blueprints.v1'
  | 'esi-characters.read_contacts.v1'
  | 'esi-characters.read_corporation_roles.v1'
  | 'esi-characters.read_fatigue.v1'
  | 'esi-characters.read_fw_stats.v1'
  | 'esi-characters.read_loyalty.v1'
  | 'esi-characters.read_medals.v1'
  | 'esi-characters.read_notifications.v1'
  | 'esi-characters.read_opportunities.v1'
  | 'esi-characters.read_standings.v1'
  | 'esi-characters.read_titles.v1'
  | 'esi-characters.write_contacts.v1'
  | 'esi-clones.read_clones.v1'
  | 'esi-clones.read_implants.v1'
  | 'esi-contracts.read_character_contracts.v1'
  | 'esi-contracts.read_corporation_contracts.v1'
  | 'esi-corporations.read_blueprints.v1'
  | 'esi-corporations.read_contacts.v1'
  | 'esi-corporations.read_container_logs.v1'
  | 'esi-corporations.read_corporation_membership.v1'
  | 'esi-corporations.read_divisions.v1'
  | 'esi-corporations.read_facilities.v1'
  | 'esi-corporations.read_fw_stats.v1'
  | 'esi-corporations.read_medals.v1'
  | 'esi-corporations.read_standings.v1'
  | 'esi-corporations.read_starbases.v1'
  | 'esi-corporations.read_structures.v1'
  | 'esi-corporations.read_titles.v1'
  | 'esi-corporations.track_members.v1'
  | 'esi-fittings.read_fittings.v1'
  | 'esi-fittings.write_fittings.v1'
  | 'esi-fleets.read_fleet.v1'
  | 'esi-fleets.write_fleet.v1'
  | 'esi-industry.read_character_jobs.v1'
  | 'esi-industry.read_character_mining.v1'
  | 'esi-industry.read_corporation_jobs.v1'
  | 'esi-industry.read_corporation_mining.v1'
  | 'esi-killmails.read_corporation_killmails.v1'
  | 'esi-killmails.read_killmails.v1'
  | 'esi-location.read_location.v1'
  | 'esi-location.read_online.v1'
  | 'esi-location.read_ship_type.v1'
  | 'esi-mail.organize_mail.v1'
  | 'esi-mail.read_mail.v1'
  | 'esi-mail.send_mail.v1'
  | 'esi-markets.read_character_orders.v1'
  | 'esi-markets.read_corporation_orders.v1'
  | 'esi-markets.structure_markets.v1'
  | 'esi-planets.manage_planets.v1'
  | 'esi-planets.read_customs_offices.v1'
  | 'esi-search.search_structures.v1'
  | 'esi-skills.read_skillqueue.v1'
  | 'esi-skills.read_skills.v1'
  | 'esi-ui.open_window.v1'
  | 'esi-ui.write_waypoint.v1'
  | 'esi-universe.read_structures.v1'
  | 'esi-wallet.read_character_wallet.v1'
  | 'esi-wallet.read_corporation_wallets.v1'

export type Role = 'Account_Take_1'
  | 'Account_Take_2'
  | 'Account_Take_3'
  | 'Account_Take_4'
  | 'Account_Take_5'
  | 'Account_Take_6'
  | 'Account_Take_7'
  | 'Accountant'
  | 'Auditor'
  | 'Communications_Officer'
  | 'Config_Equipment'
  | 'Config_Starbase_Equipment'
  | 'Container_Take_1'
  | 'Container_Take_2'
  | 'Container_Take_3'
  | 'Container_Take_4'
  | 'Container_Take_5'
  | 'Container_Take_6'
  | 'Container_Take_7'
  | 'Contract_Manager'
  | 'Diplomat'
  | 'Director'
  | 'Factory_Manager'
  | 'Fitting_Manager'
  | 'Hangar_Query_1'
  | 'Hangar_Query_2'
  | 'Hangar_Query_3'
  | 'Hangar_Query_4'
  | 'Hangar_Query_5'
  | 'Hangar_Query_6'
  | 'Hangar_Query_7'
  | 'Hangar_Take_1'
  | 'Hangar_Take_2'
  | 'Hangar_Take_3'
  | 'Hangar_Take_4'
  | 'Hangar_Take_5'
  | 'Hangar_Take_6'
  | 'Hangar_Take_7'
  | 'Junior_Accountant'
  | 'Personnel_Manager'
  | 'Rent_Factory_Facility'
  | 'Rent_Office'
  | 'Rent_Research_Facility'
  | 'Security_Officer'
  | 'Starbase_Defense_Operator'
  | 'Starbase_Fuel_Technician'
  | 'Station_Manager'
  | 'Trader'


export interface Contract {
  acceptor_id: number,
  assignee_id: number,
  availability: 'public' | 'personal' | 'corporation' | 'alliance',
  buyout?: number,
  collateral?: number,
  contract_id: number,
  date_accepted?: string,
  date_completed?: string,
  date_expired: string,
  date_issued: string,
  days_to_complete?: number,
  end_location_id?: number,
  for_corporation: boolean,
  issuer_corporation_id: number,
  issuer_id: number,
  price?: number,
  reward?: number,
  start_location_id: number,
  status: 'outstanding' | 'rejected' | 'finished' | 'cancelled',
  title?: string,
  type: 'item_exchange' | 'auction' | 'courier' | 'loan' | 'unknown',
  volume?: number,

  // These are to be added
  region_id: number,
  start_location_type: 'station' | 'structure' | 'unknown',
  start_location_system: number,
  end_location_type: 'station' | 'structure' | 'unknown',
  end_location_system: number,
}

export type Region = {
  constellations: number[],
  description?: string,
  name: string,
  region_id: number,
}

export type Station = {
  max_dockable_ship_volume: number,
  name: string,
  office_rental_cost: number,
  owner?: number,
  position: {
    x: number,
    y: number,
    z: number,
  },
  race_id: number,
  reprocessing_efficiency: number,
  reprocessing_stations_take: number,
  services?: string[],
  station_id: number,
  system_id: number,
  type_id: number,
}

export type Structure = {
  name: string,
  owner_id: number,
  position?: {
    x: number,
    y: number
    z: number
  },
  solar_system_id: number,
  type_id?: number,
}

export type System = {
  constellation_id: number,
  name: string,
  planets?: {
    asteroid_belts?: number[],
    moons?: number[],
    planet_id: number,
  },
  position: {
    x: number,
    y: number,
    z: number
  },
  security_class?: string,
  security_status: number,
  star_id?: number,
  stargates?: number[],
  stations?: number[],
  system_id: number,
}

export type Character = {
  character_id: number,
  alliance_id?: number,
  birthday: string,
  bloodline_id: number,
  corporation_id: number,
  description?: string,
  faction_id?: number,
  gender: string,
  name: string,
  race_id: number,
  security_status?: number,
  title?: string,
}

export type Corporation = {
  corporation_id: number,
  alliance_id?: number,
  ceo_id: number,
  creator_id: number,
  date_founded?: string,
  description?: string,
  faction_id?: number,
  home_station_id?: number,
  member_count: number,
  name: string,
  shares?: number,
  tax_rate: number,
  ticker: string,
  url?: string,
  war_eligible?: boolean,
}

export type Item = {
  capacity?: number,
  description: string,
  dogma_attributes?: {
    attribute_id: number,
    value: number,
  }[],
  dogma_effects: {
    effect_id: number,
    is_default: boolean,
  }[],
  graphic_id?: number,
  group_id: number,
  icon_id?: number,
  market_group_id?: number,
  mass?: number,
  name: string,
  packaged_volume?: number,
  portion_size?: number,
  published: boolean,
  radius?: number,
  type_id: number,
  volume?: number,
}
