export default function RolePermissions() {
  return (
    <section className="card info-card">
      <div className="info-title">Role Permissions:</div>
      <ul>
        <li>
          <strong>Admin:</strong> Full access including pricing, reporting, and
          user management.
        </li>
        <li>
          <strong>Staff:</strong> Can manage inventory, create GRNs and STVs, but
          cannot access financial reports or user management.
        </li>
      </ul>
    </section>
  )
}